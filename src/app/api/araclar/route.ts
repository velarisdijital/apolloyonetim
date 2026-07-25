import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const araclar = await prisma.arac.findMany({
    where: { buildingId: session.user.buildingId! },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { ad: true, soyad: true } },
      apartment: { select: { no: true } },
    },
  });

  return NextResponse.json(araclar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { plaka, marka, model, renk, tip, parkYeri, apartmentId } = body;

  if (!plaka || !plaka.trim()) {
    return NextResponse.json({ error: "Plaka zorunludur" }, { status: 400 });
  }

  const existing = await prisma.arac.findUnique({
    where: {
      buildingId_plaka: {
        buildingId: session.user.buildingId!,
        plaka: plaka.trim().toUpperCase(),
      },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Bu plaka zaten kayıtlı" }, { status: 409 });
  }

  const arac = await prisma.arac.create({
    data: {
      plaka: plaka.trim().toUpperCase(),
      marka: marka || null,
      model: model || null,
      renk: renk || null,
      tip: tip || "OTOMOBIL",
      parkYeri: parkYeri || null,
      buildingId: session.user.buildingId!,
      userId: session.user.id,
      apartmentId: apartmentId || session.user.apartmentId || null,
    },
  });

  return NextResponse.json(arac, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const arac = await prisma.arac.findUnique({ where: { id } });
  if (!arac) return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });

  if (arac.userId !== session.user.id && session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  await prisma.arac.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
