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

  const personel = await prisma.personel.findUnique({ where: { id } });

  if (!personel) {
    return NextResponse.json({ error: "Personel bulunamadi" }, { status: 404 });
  }

  if (personel.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.ad !== undefined) updateData.ad = body.ad;
  if (body.soyad !== undefined) updateData.soyad = body.soyad;
  if (body.gorev !== undefined) updateData.gorev = body.gorev;
  if (body.telefon !== undefined) updateData.telefon = body.telefon || null;
  if (body.maas !== undefined) updateData.maas = body.maas ? parseFloat(body.maas) : null;
  if (body.iseBaslama !== undefined) updateData.iseBaslama = body.iseBaslama ? new Date(body.iseBaslama) : null;

  const updated = await prisma.personel.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;

  const personel = await prisma.personel.findUnique({ where: { id } });

  if (!personel) {
    return NextResponse.json({ error: "Personel bulunamadi" }, { status: 404 });
  }

  if (personel.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  await prisma.personel.update({
    where: { id },
    data: { aktif: false },
  });

  return NextResponse.json({ success: true });
}
