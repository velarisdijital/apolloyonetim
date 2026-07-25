import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const alanlar = await prisma.ortakAlan.findMany({
    where: { buildingId: session.user.buildingId!, aktif: true },
    orderBy: { ad: "asc" },
  });

  return NextResponse.json(alanlar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { ad, aciklama, kapasite, acilisSaati, kapanisSaati, maxSure } = body;

  if (!ad) {
    return NextResponse.json({ error: "Alan adı gereklidir" }, { status: 400 });
  }

  const alan = await prisma.ortakAlan.create({
    data: {
      ad,
      aciklama: aciklama || null,
      kapasite: kapasite ? Number(kapasite) : null,
      acilisSaati: acilisSaati ?? 8,
      kapanisSaati: kapanisSaati ?? 22,
      maxSure: maxSure ?? 3,
      buildingId: session.user.buildingId!,
    },
  });

  return NextResponse.json(alan, { status: 201 });
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

  await prisma.ortakAlan.update({
    where: { id },
    data: { aktif: false },
  });

  return NextResponse.json({ success: true });
}
