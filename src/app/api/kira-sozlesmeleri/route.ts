import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const sozlesmeler = await prisma.kiraSozlesmesi.findMany({
    where: {
      buildingId: session.user.buildingId!,
      aktif: true,
    },
    include: {
      apartment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sozlesmeler);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const {
    kiracıAdSoyad,
    daireBilgisi,
    baslangicTarihi,
    bitisTarihi,
    aylikKira,
    depozito,
    artisOrani,
    sozlesmeYolu,
    not: notText,
    apartmentId,
  } = body;

  if (!kiracıAdSoyad || !kiracıAdSoyad.trim()) {
    return NextResponse.json({ error: "Kiraci adi zorunludur" }, { status: 400 });
  }

  if (!daireBilgisi || !daireBilgisi.trim()) {
    return NextResponse.json({ error: "Daire bilgisi zorunludur" }, { status: 400 });
  }

  if (!baslangicTarihi) {
    return NextResponse.json({ error: "Baslangic tarihi zorunludur" }, { status: 400 });
  }

  if (!bitisTarihi) {
    return NextResponse.json({ error: "Bitis tarihi zorunludur" }, { status: 400 });
  }

  if (!aylikKira) {
    return NextResponse.json({ error: "Aylik kira zorunludur" }, { status: 400 });
  }

  const sozlesme = await prisma.kiraSozlesmesi.create({
    data: {
      kiracıAdSoyad: kiracıAdSoyad.trim(),
      daireBilgisi: daireBilgisi.trim(),
      baslangicTarihi: new Date(baslangicTarihi),
      bitisTarihi: new Date(bitisTarihi),
      aylikKira: parseFloat(aylikKira),
      depozito: depozito ? parseFloat(depozito) : null,
      artisOrani: artisOrani ? parseFloat(artisOrani) : null,
      sozlesmeYolu: sozlesmeYolu || null,
      not: notText || null,
      apartmentId: apartmentId || null,
      buildingId: session.user.buildingId!,
    },
  });

  return NextResponse.json(sozlesme, { status: 201 });
}
