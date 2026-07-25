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

  const bakim = await prisma.periyodikBakim.findUnique({ where: { id } });
  if (!bakim) return NextResponse.json({ error: "Bakım bulunamadı" }, { status: 404 });
  if (bakim.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.baslik !== undefined) updateData.baslik = body.baslik;
  if (body.aciklama !== undefined) updateData.aciklama = body.aciklama || null;
  if (body.periyotGun !== undefined) updateData.periyotGun = parseInt(body.periyotGun);
  if (body.durum !== undefined) updateData.durum = body.durum;
  if (body.maliyet !== undefined) updateData.maliyet = body.maliyet ? parseFloat(body.maliyet) : null;
  if (body.bakimYapan !== undefined) updateData.bakimYapan = body.bakimYapan || null;
  if (body.bakimNotu !== undefined) updateData.bakimNotu = body.bakimNotu || null;
  if (body.demirbasId !== undefined) updateData.demirbasId = body.demirbasId || null;

  // If completing maintenance, set sonBakimTarihi to now and calculate next
  if (body.durum === "TAMAMLANDI") {
    const now = new Date();
    updateData.sonBakimTarihi = now;
    const sonraki = new Date(now);
    sonraki.setDate(sonraki.getDate() + (body.periyotGun ? parseInt(body.periyotGun) : bakim.periyotGun));
    updateData.sonrakiBakimTarihi = sonraki;
  }

  if (body.sonBakimTarihi !== undefined) {
    updateData.sonBakimTarihi = body.sonBakimTarihi ? new Date(body.sonBakimTarihi) : null;
  }

  const updated = await prisma.periyodikBakim.update({
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

  const bakim = await prisma.periyodikBakim.findUnique({ where: { id } });
  if (!bakim) return NextResponse.json({ error: "Bakım bulunamadı" }, { status: 404 });
  if (bakim.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  await prisma.periyodikBakim.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
