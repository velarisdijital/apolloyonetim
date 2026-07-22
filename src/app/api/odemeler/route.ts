import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { odemeSchema } from "@/lib/validations";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const odemeler = await prisma.payment.findMany({
    where: {
      apartment: { buildingId: session.user.buildingId! },
    },
    orderBy: { tarih: "desc" },
    include: {
      duesItem: {
        include: {
          dues: { select: { ay: true, yil: true, tutarKisi: true } },
        },
      },
      apartment: { select: { id: true, no: true, kat: true } },
      user: { select: { id: true, ad: true, soyad: true } },
    },
  });

  return NextResponse.json(odemeler);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (!["MASTER_ADMIN", "KAPICI"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = odemeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const duesItem = await prisma.duesItem.findUnique({
    where: { id: parsed.data.duesItemId },
    include: { dues: true, payments: true },
  });

  if (!duesItem) {
    return NextResponse.json({ error: "Aidat kalemi bulunamadı" }, { status: 404 });
  }

  const odeme = await prisma.payment.create({
    data: {
      tutar: parsed.data.tutar,
      aciklama: parsed.data.aciklama,
      onayDurumu: "ONAYLANDI",
      onaylayanId: session.user.id,
      duesItemId: parsed.data.duesItemId,
      apartmentId: parsed.data.apartmentId,
      userId: parsed.data.userId || session.user.id,
    },
  });

  const toplamOdenen = duesItem.payments.reduce(
    (sum, p) => sum + Number(p.tutar),
    0
  ) + parsed.data.tutar;

  const yeniDurum =
    toplamOdenen >= Number(duesItem.dues.tutarKisi) ? "ODENDI" : "KISMI";

  await prisma.duesItem.update({
    where: { id: parsed.data.duesItemId },
    data: { durum: yeniDurum },
  });

  return NextResponse.json(odeme, { status: 201 });
}
