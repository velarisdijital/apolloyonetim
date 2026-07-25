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

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const bildirim = await prisma.tasinmaBildirimi.findUnique({ where: { id } });

  if (!bildirim) {
    return NextResponse.json({ error: "Bildirim bulunamadi" }, { status: 404 });
  }

  if (bildirim.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.tip !== undefined) updateData.tip = body.tip;
  if (body.adSoyad !== undefined) updateData.adSoyad = body.adSoyad;
  if (body.daireBilgisi !== undefined) updateData.daireBilgisi = body.daireBilgisi;
  if (body.tarih !== undefined) updateData.tarih = body.tarih ? new Date(body.tarih) : null;
  if (body.asansorRezervasyon !== undefined) updateData.asansorRezervasyon = body.asansorRezervasyon;
  if (body.anahtarTeslim !== undefined) updateData.anahtarTeslim = body.anahtarTeslim;
  if (body.not !== undefined) updateData.not = body.not || null;

  const updated = await prisma.tasinmaBildirimi.update({
    where: { id },
    data: updateData,
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

  const bildirim = await prisma.tasinmaBildirimi.findUnique({ where: { id } });

  if (!bildirim) {
    return NextResponse.json({ error: "Bildirim bulunamadi" }, { status: 404 });
  }

  if (bildirim.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  await prisma.tasinmaBildirimi.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
