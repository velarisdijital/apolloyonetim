import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const gorev = await prisma.gorev.findUnique({ where: { id } });

  if (!gorev) {
    return NextResponse.json({ error: "Gorev bulunamadi" }, { status: 404 });
  }

  if (gorev.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.durum) {
    updateData.durum = body.durum;
    if (body.durum === "TAMAMLANDI") {
      updateData.tamamlanmaTarihi = new Date();
    }
  }
  if (body.tamamlanmaNotu !== undefined) updateData.tamamlanmaNotu = body.tamamlanmaNotu;
  if (body.atananId !== undefined) updateData.atananId = body.atananId || null;
  if (body.baslik) updateData.baslik = body.baslik;
  if (body.aciklama !== undefined) updateData.aciklama = body.aciklama;
  if (body.oncelik) updateData.oncelik = body.oncelik;
  if (body.sonTarih !== undefined) updateData.sonTarih = body.sonTarih ? new Date(body.sonTarih) : null;

  const updated = await prisma.gorev.update({
    where: { id },
    data: updateData,
    include: {
      olusturan: { select: { ad: true, soyad: true } },
      atanan: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;

  const gorev = await prisma.gorev.findUnique({ where: { id } });

  if (!gorev) {
    return NextResponse.json({ error: "Gorev bulunamadi" }, { status: 404 });
  }

  if (gorev.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  await prisma.gorev.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
