import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const yil = parseInt(searchParams.get("yil") || String(new Date().getFullYear()));
  const buildingId = session.user.buildingId!;

  const butceler = await prisma.butce.findMany({
    where: { buildingId, yil },
    orderBy: [{ ay: "asc" }, { kategori: "asc" }],
  });

  return NextResponse.json(butceler);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { yil, ay, kategori, planlanan, aciklama } = body;

  if (!yil || !ay || !kategori || planlanan === undefined) {
    return NextResponse.json({ error: "Zorunlu alanlar eksik" }, { status: 400 });
  }

  const butce = await prisma.butce.upsert({
    where: {
      buildingId_yil_ay_kategori: {
        buildingId: session.user.buildingId!,
        yil: Number(yil),
        ay: Number(ay),
        kategori,
      },
    },
    update: { planlanan: Number(planlanan), aciklama: aciklama || null },
    create: {
      yil: Number(yil),
      ay: Number(ay),
      kategori,
      planlanan: Number(planlanan),
      aciklama: aciklama || null,
      buildingId: session.user.buildingId!,
    },
  });

  return NextResponse.json(butce, { status: 201 });
}
