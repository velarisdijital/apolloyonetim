import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const buildingId = session.user.buildingId;
  if (!buildingId) return NextResponse.json({ error: "Bina atanmamış" }, { status: 400 });

  const existing = await prisma.chatRoom.findFirst({
    where: { buildingId, tip: "GENEL" },
  });

  if (existing) return NextResponse.json({ exists: true });

  await prisma.chatRoom.createMany({
    data: [
      { ad: "Genel Sohbet", tip: "GENEL", buildingId },
      { ad: "Yönetim", tip: "YONETIM", buildingId },
    ],
    skipDuplicates: true,
  });

  return NextResponse.json({ created: true });
}
