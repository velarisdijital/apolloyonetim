import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const ziyaretciler = await prisma.ziyaretci.findMany({
    where: { buildingId: session.user.buildingId! },
    orderBy: { girisTarihi: "desc" },
    include: {
      apartment: { select: { no: true } },
      kaydeden: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(ziyaretciler);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();

  const { tip, adSoyad, tcKimlik, plaka, firma, not: notField, apartmentId } = body;

  if (!adSoyad || !tip) {
    return NextResponse.json({ error: "Ad soyad ve tip zorunludur" }, { status: 400 });
  }

  const validTips = ["ZIYARETCI", "KARGO", "KURYE", "HIZMET"];
  if (!validTips.includes(tip)) {
    return NextResponse.json({ error: "Geçersiz ziyaretçi tipi" }, { status: 400 });
  }

  const ziyaretci = await prisma.ziyaretci.create({
    data: {
      tip,
      adSoyad,
      tcKimlik: tcKimlik || null,
      plaka: plaka || null,
      firma: firma || null,
      not: notField || null,
      buildingId: session.user.buildingId!,
      kaydedildiBy: session.user.id,
      apartmentId: apartmentId || null,
    },
  });

  return NextResponse.json(ziyaretci, { status: 201 });
}
