import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBuildingNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { duesItemId, tutar, dekontYolu, dekontAdi, aciklama } = body;

  if (!duesItemId || !tutar || !dekontYolu) {
    return NextResponse.json(
      { error: "Aidat kalemi, tutar ve dekont gereklidir" },
      { status: 400 }
    );
  }

  const duesItem = await prisma.duesItem.findUnique({
    where: { id: duesItemId },
    include: { dues: true, apartment: true },
  });

  if (!duesItem) {
    return NextResponse.json({ error: "Aidat kalemi bulunamadı" }, { status: 404 });
  }

  if (duesItem.apartmentId !== session.user.apartmentId) {
    return NextResponse.json({ error: "Bu aidat size ait değil" }, { status: 403 });
  }

  if (duesItem.durum === "ODENDI") {
    return NextResponse.json(
      { error: "Bu aidat kalemi zaten ödenmiş." },
      { status: 400 }
    );
  }

  const odeme = await prisma.payment.create({
    data: {
      tutar,
      aciklama,
      dekontYolu,
      dekontAdi,
      onayDurumu: "BEKLEMEDE",
      duesItemId,
      apartmentId: duesItem.apartmentId,
      userId: session.user.id,
    },
  });

  await prisma.duesItem.update({
    where: { id: duesItemId },
    data: { durum: "ONAY_BEKLIYOR" },
  });

  await createBuildingNotification(
    session.user.buildingId!,
    {
      baslik: "Yeni Ödeme Dekontu",
      mesaj: `Daire ${duesItem.apartment.no} - ${duesItem.dues.ay}/${duesItem.dues.yil} aidatı için dekont yüklendi.`,
      tip: "odeme",
      link: "/aidatlar",
    },
    session.user.id,
    ["MASTER_ADMIN", "KAPICI"]
  );

  return NextResponse.json(odeme, { status: 201 });
}
