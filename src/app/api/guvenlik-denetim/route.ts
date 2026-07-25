import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const denetimTipi = searchParams.get("denetimTipi");
  const durum = searchParams.get("durum");

  const where: Record<string, unknown> = {
    buildingId: session.user.buildingId!,
  };

  if (denetimTipi) where.denetimTipi = denetimTipi;
  if (durum) where.durum = durum;

  const denetimler = await prisma.guvenlikDenetim.findMany({
    where,
    orderBy: { tarih: "desc" },
  });

  return NextResponse.json(denetimler);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { denetimTipi, tarih, sonrakiTarih, durum, denetciAdi, bulgular, not: notText } = body;

  if (!denetimTipi) {
    return NextResponse.json({ error: "Denetim tipi zorunludur" }, { status: 400 });
  }

  const denetim = await prisma.guvenlikDenetim.create({
    data: {
      denetimTipi,
      tarih: tarih ? new Date(tarih) : new Date(),
      sonrakiTarih: sonrakiTarih ? new Date(sonrakiTarih) : null,
      durum: durum || "PLANLI",
      denetciAdi: denetciAdi || null,
      bulgular: bulgular || null,
      not: notText || null,
      buildingId: session.user.buildingId!,
    },
  });

  return NextResponse.json(denetim, { status: 201 });
}
