import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const etkinlikler = await prisma.etkinlik.findMany({
    where: { buildingId: session.user.buildingId! },
    orderBy: { tarih: "asc" },
    include: {
      katilimlar: {
        include: {
          user: { select: { id: true, ad: true, soyad: true } },
        },
      },
    },
  });

  const result = etkinlikler.map((e) => ({
    ...e,
    katilimciSayisi: e.katilimlar.length,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { baslik, aciklama, tarih, bitisTarihi, konum, kapasite } = body;

  if (!baslik || !baslik.trim()) {
    return NextResponse.json({ error: "Baslik zorunludur" }, { status: 400 });
  }

  if (!tarih) {
    return NextResponse.json({ error: "Tarih zorunludur" }, { status: 400 });
  }

  const etkinlik = await prisma.etkinlik.create({
    data: {
      baslik: baslik.trim(),
      aciklama: aciklama?.trim() || null,
      tarih: new Date(tarih),
      bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : null,
      konum: konum?.trim() || null,
      kapasite: kapasite ? parseInt(kapasite, 10) : null,
      buildingId: session.user.buildingId!,
    },
    include: {
      katilimlar: {
        include: {
          user: { select: { id: true, ad: true, soyad: true } },
        },
      },
    },
  });

  return NextResponse.json({ ...etkinlik, katilimciSayisi: 0 }, { status: 201 });
}
