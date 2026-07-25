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

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const sikayet = await prisma.sikayet.findUnique({ where: { id } });

  if (!sikayet) {
    return NextResponse.json({ error: "Sikayet bulunamadi" }, { status: 404 });
  }

  if (sikayet.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.durum !== undefined) updateData.durum = body.durum;
  if (body.yapilanIslem !== undefined) updateData.yapilanIslem = body.yapilanIslem || null;

  const updated = await prisma.sikayet.update({
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

  const { id } = await params;

  const sikayet = await prisma.sikayet.findUnique({ where: { id } });

  if (!sikayet) {
    return NextResponse.json({ error: "Sikayet bulunamadi" }, { status: 404 });
  }

  if (sikayet.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const isAdmin = session.user.rol === "MASTER_ADMIN";
  const isOwner = sikayet.bildirenId === session.user.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  await prisma.sikayet.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
