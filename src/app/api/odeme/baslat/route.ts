import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProvider } from "@/lib/payment";
import { clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Bir aidat kalemi için online ödeme başlatır. Yapılandırılmış sağlayıcı yoksa 503.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const provider = getProvider();
  if (!provider) {
    return NextResponse.json({ error: "Online ödeme yapılandırılmamış" }, { status: 503 });
  }

  const { duesItemId } = await req.json();
  if (!duesItemId) return NextResponse.json({ error: "duesItemId gerekli" }, { status: 400 });

  // Tenant isolation: kalem kullanıcının binasına ait olmalı
  const item = await prisma.duesItem.findFirst({
    where: { id: duesItemId, dues: { buildingId: session.user.buildingId! } },
    include: { dues: true, payments: true },
  });
  if (!item) return NextResponse.json({ error: "Aidat kalemi bulunamadı" }, { status: 404 });

  const approved = item.payments
    .filter((p) => p.onayDurumu === "ONAYLANDI")
    .reduce((s, p) => s + Number(p.tutar), 0);
  const remaining = Number(item.dues.tutarKisi) - approved;
  if (remaining <= 0) {
    return NextResponse.json({ error: "Bu aidat zaten ödenmiş" }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      tutar: remaining,
      duesItemId: item.id,
      apartmentId: item.apartmentId,
      userId: session.user.id,
      onayDurumu: "BEKLEMEDE",
      aciklama: `Online ödeme (${provider.name}) başlatıldı`,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { ad: true, soyad: true, email: true, telefon: true },
  });

  const result = await provider.initCheckout({
    orderId: payment.id,
    amount: remaining,
    email: user?.email || "musteri@apolloyonetim.com",
    name: `${user?.ad ?? ""} ${user?.soyad ?? ""}`.trim() || "Kullanıcı",
    phone: user?.telefon || undefined,
    userIp: clientIp(req.headers),
    description: `${item.dues.ay}/${item.dues.yil} Aidat`,
  });

  if (!result.ok) {
    await prisma.payment.delete({ where: { id: payment.id } }); // başarısız init: kaydı temizle
    return NextResponse.json({ error: result.error || "Ödeme başlatılamadı" }, { status: 502 });
  }

  return NextResponse.json({ redirectUrl: result.redirectUrl });
}
