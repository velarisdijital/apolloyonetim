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

  const sozlesme = await prisma.kiraSozlesmesi.findUnique({ where: { id } });

  if (!sozlesme) {
    return NextResponse.json({ error: "Sozlesme bulunamadi" }, { status: 404 });
  }

  if (sozlesme.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.kiracıAdSoyad !== undefined) updateData.kiracıAdSoyad = body.kiracıAdSoyad;
  if (body.daireBilgisi !== undefined) updateData.daireBilgisi = body.daireBilgisi;
  if (body.baslangicTarihi !== undefined) updateData.baslangicTarihi = body.baslangicTarihi ? new Date(body.baslangicTarihi) : null;
  if (body.bitisTarihi !== undefined) updateData.bitisTarihi = body.bitisTarihi ? new Date(body.bitisTarihi) : null;
  if (body.aylikKira !== undefined) updateData.aylikKira = parseFloat(body.aylikKira);
  if (body.depozito !== undefined) updateData.depozito = body.depozito ? parseFloat(body.depozito) : null;
  if (body.artisOrani !== undefined) updateData.artisOrani = body.artisOrani ? parseFloat(body.artisOrani) : null;
  if (body.sozlesmeYolu !== undefined) updateData.sozlesmeYolu = body.sozlesmeYolu || null;
  if (body.not !== undefined) updateData.not = body.not || null;
  if (body.apartmentId !== undefined) updateData.apartmentId = body.apartmentId || null;

  const updated = await prisma.kiraSozlesmesi.update({
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

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;

  const sozlesme = await prisma.kiraSozlesmesi.findUnique({ where: { id } });

  if (!sozlesme) {
    return NextResponse.json({ error: "Sozlesme bulunamadi" }, { status: 404 });
  }

  if (sozlesme.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  await prisma.kiraSozlesmesi.update({
    where: { id },
    data: { aktif: false },
  });

  return NextResponse.json({ success: true });
}
