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

  const denetim = await prisma.guvenlikDenetim.findUnique({ where: { id } });

  if (!denetim) {
    return NextResponse.json({ error: "Denetim bulunamadi" }, { status: 404 });
  }

  if (denetim.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.denetimTipi !== undefined) updateData.denetimTipi = body.denetimTipi;
  if (body.tarih !== undefined) updateData.tarih = body.tarih ? new Date(body.tarih) : null;
  if (body.sonrakiTarih !== undefined) updateData.sonrakiTarih = body.sonrakiTarih ? new Date(body.sonrakiTarih) : null;
  if (body.durum !== undefined) updateData.durum = body.durum;
  if (body.denetciAdi !== undefined) updateData.denetciAdi = body.denetciAdi || null;
  if (body.bulgular !== undefined) updateData.bulgular = body.bulgular || null;
  if (body.not !== undefined) updateData.not = body.not || null;

  const updated = await prisma.guvenlikDenetim.update({
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

  const denetim = await prisma.guvenlikDenetim.findUnique({ where: { id } });

  if (!denetim) {
    return NextResponse.json({ error: "Denetim bulunamadi" }, { status: 404 });
  }

  if (denetim.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  await prisma.guvenlikDenetim.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
