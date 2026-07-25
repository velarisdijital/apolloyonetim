import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  const etkinlik = await prisma.etkinlik.findUnique({
    where: { id },
    include: { katilimlar: true },
  });

  if (!etkinlik) {
    return NextResponse.json({ error: "Etkinlik bulunamadi" }, { status: 404 });
  }

  if (etkinlik.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  // Check if user already joined
  const existing = await prisma.etkinlikKatilim.findUnique({
    where: {
      etkinlikId_userId: {
        etkinlikId: id,
        userId: session.user.id,
      },
    },
  });

  if (existing) {
    // Leave - delete participation
    await prisma.etkinlikKatilim.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ action: "left" });
  }

  // Join - check capacity
  if (etkinlik.kapasite) {
    const currentCount = etkinlik.katilimlar.length;
    if (currentCount >= etkinlik.kapasite) {
      return NextResponse.json({ error: "Etkinlik kapasitesi dolu" }, { status: 400 });
    }
  }

  await prisma.etkinlikKatilim.create({
    data: {
      etkinlikId: id,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ action: "joined" });
}
