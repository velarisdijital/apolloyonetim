import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const malzemeler = await prisma.stokMalzeme.findMany({
    where: { buildingId: session.user.buildingId!, aktif: true },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { hareketler: true } },
    },
  });

  return NextResponse.json(malzemeler);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { ad, kategori, birim, miktar, minimumMiktar, birimFiyat, konum } = body;

  if (!ad || !ad.trim()) {
    return NextResponse.json({ error: "Malzeme adı zorunludur" }, { status: 400 });
  }

  if (!kategori) {
    return NextResponse.json({ error: "Kategori zorunludur" }, { status: 400 });
  }

  const malzeme = await prisma.stokMalzeme.create({
    data: {
      ad: ad.trim(),
      kategori,
      birim: birim || "ADET",
      miktar: miktar ? parseFloat(miktar) : 0,
      minimumMiktar: minimumMiktar ? parseFloat(minimumMiktar) : null,
      birimFiyat: birimFiyat ? parseFloat(birimFiyat) : null,
      konum: konum || null,
      buildingId: session.user.buildingId!,
    },
    include: {
      _count: { select: { hareketler: true } },
    },
  });

  return NextResponse.json(malzeme, { status: 201 });
}
