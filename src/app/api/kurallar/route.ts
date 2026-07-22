import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const kurallar = await prisma.binaKurali.findMany({
    where: { buildingId: session.user.buildingId! },
    orderBy: { sira: "asc" },
    include: {
      createdBy: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(kurallar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { baslik, icerik, kategori } = body;

  if (!baslik || !icerik) {
    return NextResponse.json({ error: "Başlık ve içerik gereklidir" }, { status: 400 });
  }

  const maxSira = await prisma.binaKurali.aggregate({
    where: { buildingId: session.user.buildingId! },
    _max: { sira: true },
  });

  const kural = await prisma.binaKurali.create({
    data: {
      baslik,
      icerik,
      kategori: kategori || "GENEL",
      sira: (maxSira._max.sira || 0) + 1,
      buildingId: session.user.buildingId!,
      createdById: session.user.id,
    },
    include: {
      createdBy: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(kural, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.binaKurali.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
