import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const durum = searchParams.get("durum");
  const oncelik = searchParams.get("oncelik");
  const atananId = searchParams.get("atananId");

  const where: Record<string, unknown> = {
    buildingId: session.user.buildingId!,
  };

  if (durum) where.durum = durum;
  if (oncelik) where.oncelik = oncelik;
  if (atananId) where.atananId = atananId;

  const gorevler = await prisma.gorev.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      olusturan: { select: { ad: true, soyad: true } },
      atanan: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(gorevler);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { baslik, aciklama, oncelik, sonTarih, atananId } = body;

  if (!baslik || !baslik.trim()) {
    return NextResponse.json({ error: "Baslik zorunludur" }, { status: 400 });
  }

  const gorev = await prisma.gorev.create({
    data: {
      baslik: baslik.trim(),
      aciklama: aciklama?.trim() || null,
      oncelik: oncelik || "NORMAL",
      sonTarih: sonTarih ? new Date(sonTarih) : null,
      buildingId: session.user.buildingId!,
      olusturanId: session.user.id,
      atananId: atananId || null,
    },
    include: {
      olusturan: { select: { ad: true, soyad: true } },
      atanan: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(gorev, { status: 201 });
}
