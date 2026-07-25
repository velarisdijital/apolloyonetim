import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kategori = searchParams.get("kategori");
  const durum = searchParams.get("durum");

  const where: Record<string, unknown> = {
    buildingId: session.user.buildingId!,
    aktif: true,
  };

  if (kategori) where.kategori = kategori;
  if (durum) where.durum = durum;

  const demirbaslar = await prisma.demirbas.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(demirbaslar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { ad, kategori, marka, model, seriNo, konum, durum, edinmeTarihi, garantiBitis, deger, not: notText } = body;

  if (!ad || !ad.trim()) {
    return NextResponse.json({ error: "Demirbaş adı zorunludur" }, { status: 400 });
  }

  if (!kategori) {
    return NextResponse.json({ error: "Kategori zorunludur" }, { status: 400 });
  }

  const demirbas = await prisma.demirbas.create({
    data: {
      ad: ad.trim(),
      kategori,
      marka: marka || null,
      model: model || null,
      seriNo: seriNo || null,
      konum: konum || null,
      durum: durum || "AKTIF",
      edinmeTarihi: edinmeTarihi ? new Date(edinmeTarihi) : null,
      garantiBitis: garantiBitis ? new Date(garantiBitis) : null,
      deger: deger ? parseFloat(deger) : null,
      not: notText || null,
      buildingId: session.user.buildingId!,
    },
  });

  return NextResponse.json(demirbas, { status: 201 });
}
