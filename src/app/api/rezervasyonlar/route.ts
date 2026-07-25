import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rezervasyonSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ay = searchParams.get("ay");
  const yil = searchParams.get("yil");
  const ortakAlanId = searchParams.get("ortakAlanId");

  const where: Record<string, unknown> = {
    buildingId: session.user.buildingId!,
  };

  if (ortakAlanId) {
    where.ortakAlanId = ortakAlanId;
  }

  if (ay && yil) {
    const start = new Date(Date.UTC(Number(yil), Number(ay) - 1, 1));
    const end = new Date(Date.UTC(Number(yil), Number(ay), 0));
    where.tarih = { gte: start, lte: end };
  }

  const rezervasyonlar = await prisma.reservation.findMany({
    where,
    orderBy: [{ tarih: "asc" }, { baslangicSaati: "asc" }],
    include: {
      user: { select: { id: true, ad: true, soyad: true } },
      ortakAlan: { select: { id: true, ad: true } },
    },
  });

  return NextResponse.json(rezervasyonlar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const parsed = rezervasyonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const { tarih, baslangicSaati, bitisSaati, aciklama, ortakAlanId } = parsed.data;

  let maxSure = 3;
  let kapanisSaati = 22;

  if (ortakAlanId) {
    const alan = await prisma.ortakAlan.findUnique({ where: { id: ortakAlanId } });
    if (alan) {
      maxSure = alan.maxSure;
      kapanisSaati = alan.kapanisSaati;
    }
  }

  if (bitisSaati - baslangicSaati > maxSure) {
    return NextResponse.json({ error: `Maksimum ${maxSure} saat rezervasyon yapılabilir` }, { status: 400 });
  }
  if (bitisSaati > kapanisSaati) {
    return NextResponse.json({ error: `Alan ${kapanisSaati}:00'e kadar açıktır` }, { status: 400 });
  }
  if (bitisSaati <= baslangicSaati) {
    return NextResponse.json({ error: "Bitiş saati başlangıçtan sonra olmalıdır" }, { status: 400 });
  }

  const rezervasyonTarihi = new Date(tarih + "T12:00:00Z");

  const conflictWhere: Record<string, unknown> = {
    buildingId: session.user.buildingId!,
    tarih: rezervasyonTarihi,
    OR: [
      { baslangicSaati: { lt: bitisSaati }, bitisSaati: { gt: baslangicSaati } },
    ],
  };

  if (ortakAlanId) {
    conflictWhere.ortakAlanId = ortakAlanId;
  }

  const existing = await prisma.reservation.findFirst({ where: conflictWhere });

  if (existing) {
    return NextResponse.json({ error: "Bu zaman diliminde başka bir rezervasyon var" }, { status: 409 });
  }

  const rezervasyon = await prisma.reservation.create({
    data: {
      tarih: rezervasyonTarihi,
      baslangicSaati,
      bitisSaati,
      aciklama: aciklama || null,
      ortakAlanId: ortakAlanId || null,
      buildingId: session.user.buildingId!,
      userId: session.user.id,
    },
    include: {
      user: { select: { id: true, ad: true, soyad: true } },
      ortakAlan: { select: { id: true, ad: true } },
    },
  });

  return NextResponse.json(rezervasyon, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const rezervasyon = await prisma.reservation.findUnique({ where: { id } });
  if (!rezervasyon) {
    return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
  }

  if (rezervasyon.userId !== session.user.id && !["MASTER_ADMIN", "KAPICI"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Bu rezervasyonu iptal etme yetkiniz yok" }, { status: 403 });
  }

  await prisma.reservation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
