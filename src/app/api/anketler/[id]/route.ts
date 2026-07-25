import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  const anket = await prisma.anket.findUnique({
    where: { id },
    include: {
      sorular: {
        orderBy: { sira: "asc" },
        include: {
          cevaplar: {
            include: {
              user: { select: { id: true, ad: true, soyad: true } },
            },
          },
        },
      },
    },
  });

  if (!anket) {
    return NextResponse.json({ error: "Anket bulunamadi" }, { status: 404 });
  }

  return NextResponse.json(anket);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { baslik, aciklama, durum, bitisTarihi, anonim } = body;

  const existing = await prisma.anket.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Anket bulunamadi" }, { status: 404 });
  }

  const anket = await prisma.anket.update({
    where: { id },
    data: {
      ...(baslik !== undefined && { baslik: baslik.trim() }),
      ...(aciklama !== undefined && { aciklama: aciklama?.trim() || null }),
      ...(durum !== undefined && { durum }),
      ...(bitisTarihi !== undefined && { bitisTarihi: new Date(bitisTarihi) }),
      ...(anonim !== undefined && { anonim }),
    },
    include: {
      sorular: { orderBy: { sira: "asc" } },
    },
  });

  return NextResponse.json(anket);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.anket.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Anket bulunamadi" }, { status: 404 });
  }

  await prisma.anket.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
