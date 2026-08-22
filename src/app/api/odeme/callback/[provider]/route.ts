import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProvider } from "@/lib/payment";
import { notifyUser } from "@/lib/notify";

export const dynamic = "force-dynamic";

// Sağlayıcı geri bildirimi (public; imza/token ile doğrulanır).
// PayTR bu URL'e POST eder ve düz metin "OK" bekler; iyzico token POST eder.
export async function POST(req: NextRequest) {
  const provider = getProvider();
  if (!provider) return new NextResponse("payment disabled", { status: 503 });

  const result = await provider.handleCallback(req);
  if (!result.ok || !result.orderId) {
    return new NextResponse(result.reply || "FAIL", { status: 200 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: result.orderId },
    include: { duesItem: { include: { dues: true } } },
  });
  if (!payment) return new NextResponse(result.reply || "OK", { status: 200 });

  // Idempotent: yalnızca BEKLEMEDE durumundakini işle (tekrarlı bildirim güvenli)
  if (payment.onayDurumu === "BEKLEMEDE") {
    if (result.success) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { onayDurumu: "ONAYLANDI", aciklama: `Online ödeme (${provider.name}) - onaylandı` },
        });
        const fresh = await tx.payment.findMany({ where: { duesItemId: payment.duesItemId } });
        const toplam = fresh
          .filter((p) => p.onayDurumu === "ONAYLANDI")
          .reduce((s, p) => s + Number(p.tutar), 0);
        const durum = toplam >= Number(payment.duesItem.dues.tutarKisi) ? "ODENDI" : "KISMI";
        await tx.duesItem.update({ where: { id: payment.duesItemId }, data: { durum } });
      });
      await notifyUser(
        payment.userId,
        {
          baslik: "Ödeme Alındı",
          mesaj: `${payment.duesItem.dues.ay}/${payment.duesItem.dues.yil} aidat ödemeniz başarıyla alındı.`,
          tip: "odeme",
          link: "/aidatlar",
        },
        { email: true }
      );
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { onayDurumu: "REDDEDILDI", aciklama: `Online ödeme (${provider.name}) - başarısız` },
      });
    }
  }

  return new NextResponse(result.reply || "OK", { status: 200 });
}
