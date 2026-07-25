import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { title, body, url, userIds } = await req.json();

  if (!title || !body) {
    return NextResponse.json({ error: "Başlık ve mesaj gerekli" }, { status: 400 });
  }

  const where: { userId?: { in: string[] } } = {};
  if (userIds?.length) {
    where.userId = { in: userIds };
  }

  const subscriptions = await prisma.pushSubscription.findMany({ where });

  let sent = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];

  for (const sub of subscriptions) {
    const success = await sendPushNotification(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      { title, body, url: url || "/bildirimler", tag: "apollo-push" }
    );
    if (success) {
      sent++;
    } else {
      failed++;
      expiredEndpoints.push(sub.endpoint);
    }
  }

  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: expiredEndpoints } },
    });
  }

  return NextResponse.json({ sent, failed, total: subscriptions.length });
}
