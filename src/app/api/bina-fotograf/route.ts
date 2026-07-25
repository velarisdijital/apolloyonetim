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
  };

  if (kategori) where.kategori = kategori;

  const fotograflar = await prisma.binaFotograf.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(fotograflar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { baslik, aciklama, kategori, fotografYolu } = body;

  if (!baslik || !baslik.trim()) {
    return NextResponse.json({ error: "Baslik zorunludur" }, { status: 400 });
  }

  if (!kategori) {
    return NextResponse.json({ error: "Kategori zorunludur" }, { status: 400 });
  }

  if (!fotografYolu) {
    return NextResponse.json({ error: "Fotograf zorunludur" }, { status: 400 });
  }

  const fotograf = await prisma.binaFotograf.create({
    data: {
      baslik: baslik.trim(),
      aciklama: aciklama || null,
      kategori,
      fotografYolu,
      buildingId: session.user.buildingId!,
    },
  });

  return NextResponse.json(fotograf, { status: 201 });
}
