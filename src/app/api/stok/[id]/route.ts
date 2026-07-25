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

  const malzeme = await prisma.stokMalzeme.findUnique({ where: { id } });

  if (!malzeme) {
    return NextResponse.json({ error: "Malzeme bulunamadı" }, { status: 404 });
  }

  if (malzeme.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.ad !== undefined) updateData.ad = body.ad;
  if (body.kategori !== undefined) updateData.kategori = body.kategori;
  if (body.birim !== undefined) updateData.birim = body.birim;
  if (body.minimumMiktar !== undefined) updateData.minimumMiktar = body.minimumMiktar ? parseFloat(body.minimumMiktar) : null;
  if (body.birimFiyat !== undefined) updateData.birimFiyat = body.birimFiyat ? parseFloat(body.birimFiyat) : null;
  if (body.konum !== undefined) updateData.konum = body.konum || null;

  const updated = await prisma.stokMalzeme.update({
    where: { id },
    data: updateData,
    include: {
      _count: { select: { hareketler: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;

  const malzeme = await prisma.stokMalzeme.findUnique({ where: { id } });

  if (!malzeme) {
    return NextResponse.json({ error: "Malzeme bulunamadı" }, { status: 404 });
  }

  if (malzeme.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  await prisma.stokMalzeme.update({
    where: { id },
    data: { aktif: false },
  });

  return NextResponse.json({ success: true });
}
