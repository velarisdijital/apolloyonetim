import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tip = searchParams.get("tip");

  const where: Record<string, unknown> = {
    buildingId: session.user.buildingId!,
  };

  if (tip) where.tip = tip;

  const bildirimler = await prisma.tasinmaBildirimi.findMany({
    where,
    orderBy: { tarih: "desc" },
  });

  return NextResponse.json(bildirimler);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { tip, adSoyad, daireBilgisi, tarih, asansorRezervasyon, anahtarTeslim, not: notText } = body;

  if (!tip) {
    return NextResponse.json({ error: "Tasinma tipi zorunludur" }, { status: 400 });
  }

  if (!adSoyad || !adSoyad.trim()) {
    return NextResponse.json({ error: "Ad soyad zorunludur" }, { status: 400 });
  }

  if (!daireBilgisi || !daireBilgisi.trim()) {
    return NextResponse.json({ error: "Daire bilgisi zorunludur" }, { status: 400 });
  }

  const bildirim = await prisma.tasinmaBildirimi.create({
    data: {
      tip,
      adSoyad: adSoyad.trim(),
      daireBilgisi: daireBilgisi.trim(),
      tarih: tarih ? new Date(tarih) : new Date(),
      asansorRezervasyon: asansorRezervasyon || false,
      anahtarTeslim: anahtarTeslim || false,
      not: notText || null,
      buildingId: session.user.buildingId!,
    },
  });

  return NextResponse.json(bildirim, { status: 201 });
}
