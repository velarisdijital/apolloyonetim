import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kategori = searchParams.get("kategori");

  const where: Record<string, unknown> = {
    buildingId: session.user.buildingId!,
    aktif: true,
  };

  if (kategori) {
    where.kategori = kategori;
  }

  const hizmetler = await prisma.hizmetSaglayici.findMany({
    where,
    orderBy: [{ kategori: "asc" }, { ad: "asc" }],
    include: {
      ekleyen: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(hizmetler);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const body = await req.json();
  const { ad, kategori, telefon, adres, aciklama } = body;

  if (!ad || !kategori || !telefon) {
    return NextResponse.json(
      { error: "Ad, kategori ve telefon zorunludur" },
      { status: 400 }
    );
  }

  const gecerliKategoriler = [
    "TESISATCI",
    "ELEKTRIKCI",
    "BOYACI",
    "TEMIZLIK",
    "CILINGIR",
    "NAKLIYE",
    "BAHCE",
    "ASANSOR",
    "DIGER",
  ];

  if (!gecerliKategoriler.includes(kategori)) {
    return NextResponse.json(
      { error: "Gecersiz kategori" },
      { status: 400 }
    );
  }

  const hizmet = await prisma.hizmetSaglayici.create({
    data: {
      ad,
      kategori,
      telefon,
      adres: adres || null,
      aciklama: aciklama || null,
      buildingId: session.user.buildingId!,
      ekleyenId: session.user.id,
    },
  });

  return NextResponse.json(hizmet, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID gereklidir" }, { status: 400 });
  }

  const hizmet = await prisma.hizmetSaglayici.findFirst({
    where: { id, buildingId: session.user.buildingId! },
  });

  if (!hizmet) {
    return NextResponse.json({ error: "Bulunamadi" }, { status: 404 });
  }

  await prisma.hizmetSaglayici.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
