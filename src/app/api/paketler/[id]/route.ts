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

  const paket = await prisma.paketKargo.findUnique({ where: { id } });

  if (!paket) {
    return NextResponse.json({ error: "Paket bulunamadi" }, { status: 404 });
  }

  if (paket.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.teslimEdildi !== undefined) {
    updateData.teslimEdildi = body.teslimEdildi;
    if (body.teslimEdildi === true) {
      updateData.alimTarihi = new Date();
    }
  }
  if (body.aliciAdi !== undefined) updateData.aliciAdi = body.aliciAdi;
  if (body.daireBilgisi !== undefined) updateData.daireBilgisi = body.daireBilgisi;
  if (body.kargoFirmasi !== undefined) updateData.kargoFirmasi = body.kargoFirmasi || null;
  if (body.takipNo !== undefined) updateData.takipNo = body.takipNo || null;
  if (body.not !== undefined) updateData.not = body.not || null;

  const updated = await prisma.paketKargo.update({
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

  const paket = await prisma.paketKargo.findUnique({ where: { id } });

  if (!paket) {
    return NextResponse.json({ error: "Paket bulunamadi" }, { status: 404 });
  }

  if (paket.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  await prisma.paketKargo.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
