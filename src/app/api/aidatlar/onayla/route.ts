import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (!["MASTER_ADMIN", "KAPICI"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { paymentId, onayDurumu, onayNotu } = body;

  if (!paymentId || !["ONAYLANDI", "REDDEDILDI"].includes(onayDurumu)) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { duesItem: { include: { dues: true } } },
  });

  if (!payment) {
    return NextResponse.json({ error: "Ödeme bulunamadı" }, { status: 404 });
  }

  // Tenant isolation: ödeme yöneticinin binasına ait olmalı
  if (payment.duesItem.dues.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Ödeme bulunamadı" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    // 1. Update the payment's approval status
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        onayDurumu,
        onayNotu,
        onaylayanId: session.user.id,
      },
    });

    // 2. Re-fetch all payments for this duesItem after the update
    const freshPayments = await tx.payment.findMany({
      where: { duesItemId: payment.duesItemId },
    });

    // 3. Calculate status from fresh data
    if (onayDurumu === "ONAYLANDI") {
      const approvedPayments = freshPayments.filter(
        (p) => p.onayDurumu === "ONAYLANDI"
      );
      const toplamOdenen = approvedPayments.reduce(
        (sum, p) => sum + Number(p.tutar),
        0
      );

      const yeniDurum =
        toplamOdenen >= Number(payment.duesItem.dues.tutarKisi) ? "ODENDI" : "KISMI";

      await tx.duesItem.update({
        where: { id: payment.duesItemId },
        data: { durum: yeniDurum },
      });
    } else {
      const otherApproved = freshPayments.filter(
        (p) => p.id !== paymentId && p.onayDurumu === "ONAYLANDI"
      );
      const hasPending = freshPayments.some(
        (p) => p.id !== paymentId && p.onayDurumu === "BEKLEMEDE"
      );

      let yeniDurum: "ODENMEDI" | "ODENDI" | "KISMI" | "ONAY_BEKLIYOR";
      if (hasPending) {
        yeniDurum = "ONAY_BEKLIYOR";
      } else if (otherApproved.length > 0) {
        const toplamOdenen = otherApproved.reduce(
          (sum, p) => sum + Number(p.tutar),
          0
        );
        yeniDurum =
          toplamOdenen >= Number(payment.duesItem.dues.tutarKisi) ? "ODENDI" : "KISMI";
      } else {
        yeniDurum = "ODENMEDI";
      }

      await tx.duesItem.update({
        where: { id: payment.duesItemId },
        data: { durum: yeniDurum },
      });
    }
  });

  await prisma.notification.create({
    data: {
      baslik: onayDurumu === "ONAYLANDI" ? "Ödeme Onaylandı" : "Ödeme Reddedildi",
      mesaj:
        onayDurumu === "ONAYLANDI"
          ? `${payment.duesItem.dues.ay}/${payment.duesItem.dues.yil} aidatınız onaylandı.`
          : `${payment.duesItem.dues.ay}/${payment.duesItem.dues.yil} aidatınız reddedildi.${onayNotu ? ` Not: ${onayNotu}` : ""}`,
      tip: "odeme",
      link: "/aidatlar",
      userId: payment.userId,
    },
  });

  return NextResponse.json({ success: true });
}
