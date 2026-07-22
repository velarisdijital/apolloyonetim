import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const countOnly = searchParams.get("count");

  if (countOnly) {
    const count = await prisma.notification.count({
      where: { userId: session.user.id, okundu: false },
    });
    return NextResponse.json({ count });
  }

  const bildirimler = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(bildirimler);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();

  if (body.tumunuOku) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, okundu: false },
      data: { okundu: true },
    });
    return NextResponse.json({ success: true });
  }

  if (body.id) {
    await prisma.notification.update({
      where: { id: body.id, userId: session.user.id },
      data: { okundu: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
}
