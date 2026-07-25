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

  const demirbas = await prisma.demirbas.findUnique({ where: { id } });

  if (!demirbas) {
    return NextResponse.json({ error: "Demirbaş bulunamadı" }, { status: 404 });
  }

  if (demirbas.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.ad !== undefined) updateData.ad = body.ad;
  if (body.kategori !== undefined) updateData.kategori = body.kategori;
  if (body.marka !== undefined) updateData.marka = body.marka || null;
  if (body.model !== undefined) updateData.model = body.model || null;
  if (body.seriNo !== undefined) updateData.seriNo = body.seriNo || null;
  if (body.konum !== undefined) updateData.konum = body.konum || null;
  if (body.durum !== undefined) updateData.durum = body.durum;
  if (body.edinmeTarihi !== undefined) updateData.edinmeTarihi = body.edinmeTarihi ? new Date(body.edinmeTarihi) : null;
  if (body.garantiBitis !== undefined) updateData.garantiBitis = body.garantiBitis ? new Date(body.garantiBitis) : null;
  if (body.deger !== undefined) updateData.deger = body.deger ? parseFloat(body.deger) : null;
  if (body.not !== undefined) updateData.not = body.not || null;

  const updated = await prisma.demirbas.update({
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

  const demirbas = await prisma.demirbas.findUnique({ where: { id } });

  if (!demirbas) {
    return NextResponse.json({ error: "Demirbaş bulunamadı" }, { status: 404 });
  }

  if (demirbas.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  await prisma.demirbas.update({
    where: { id },
    data: { aktif: false },
  });

  return NextResponse.json({ success: true });
}
