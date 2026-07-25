import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { baslik, aciklama, tarih, bitisTarihi, konum, kapasite, aktif } = body;

  const etkinlik = await prisma.etkinlik.findUnique({ where: { id } });
  if (!etkinlik) {
    return NextResponse.json({ error: "Etkinlik bulunamadi" }, { status: 404 });
  }

  if (etkinlik.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const updated = await prisma.etkinlik.update({
    where: { id },
    data: {
      ...(baslik !== undefined && { baslik: baslik.trim() }),
      ...(aciklama !== undefined && { aciklama: aciklama?.trim() || null }),
      ...(tarih !== undefined && { tarih: new Date(tarih) }),
      ...(bitisTarihi !== undefined && { bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : null }),
      ...(konum !== undefined && { konum: konum?.trim() || null }),
      ...(kapasite !== undefined && { kapasite: kapasite ? parseInt(kapasite, 10) : null }),
      ...(aktif !== undefined && { aktif }),
    },
    include: {
      katilimlar: {
        include: {
          user: { select: { id: true, ad: true, soyad: true } },
        },
      },
    },
  });

  return NextResponse.json({ ...updated, katilimciSayisi: updated.katilimlar.length });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;

  const etkinlik = await prisma.etkinlik.findUnique({ where: { id } });
  if (!etkinlik) {
    return NextResponse.json({ error: "Etkinlik bulunamadi" }, { status: 404 });
  }

  if (etkinlik.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  await prisma.etkinlik.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
