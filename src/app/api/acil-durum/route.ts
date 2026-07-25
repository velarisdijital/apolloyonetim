import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const acilDurumlar = await prisma.acilDurum.findMany({
    where: { buildingId: session.user.buildingId! },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(acilDurumlar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();

  const validTipler = ["YANGIN", "SU_BASKINI", "GAZ_KACAGI", "GUVENLIK", "SAGLIK", "DIGER"];
  if (!body.tip || !validTipler.includes(body.tip)) {
    return NextResponse.json({ error: "Geçersiz acil durum tipi" }, { status: 400 });
  }

  const acilDurum = await prisma.acilDurum.create({
    data: {
      tip: body.tip,
      aciklama: body.aciklama || null,
      konum: body.konum || null,
      buildingId: session.user.buildingId!,
      userId: session.user.id,
    },
  });

  return NextResponse.json(acilDurum, { status: 201 });
}
