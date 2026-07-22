import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const userId = session.user.id;
  const buildingId = session.user.buildingId;

  if (!buildingId) return NextResponse.json([]);

  const rooms = await prisma.chatRoom.findMany({
    where: {
      buildingId,
      OR: [
        { tip: "GENEL" },
        { tip: "YONETIM", building: { users: { some: { id: userId, rol: { in: ["MASTER_ADMIN", "KAPICI", "DENETCI"] } } } } },
        { members: { some: { userId } } },
      ],
    },
    include: {
      members: { where: { userId }, select: { sonOkunma: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { ad: true, soyad: true } } },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const result = rooms.map((room) => {
    const memberRecord = room.members[0];
    const lastMessage = room.messages[0];
    let unreadCount = 0;

    if (memberRecord && lastMessage) {
      unreadCount = memberRecord.sonOkunma < lastMessage.createdAt ? 1 : 0;
    } else if (!memberRecord && lastMessage) {
      unreadCount = 1;
    }

    return {
      id: room.id,
      ad: room.ad,
      tip: room.tip,
      lastMessage: lastMessage
        ? {
            icerik: lastMessage.icerik.substring(0, 60),
            sender: `${lastMessage.sender.ad} ${lastMessage.sender.soyad}`,
            createdAt: lastMessage.createdAt,
          }
        : null,
      unreadCount,
      messageCount: room._count.messages,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const buildingId = session.user.buildingId;
  if (!buildingId) return NextResponse.json({ error: "Bina atanmamış" }, { status: 400 });

  const body = await req.json();
  const { ad, tip, memberIds } = body;

  if (!ad || !tip) {
    return NextResponse.json({ error: "Ad ve tip gerekli" }, { status: 400 });
  }

  const room = await prisma.chatRoom.create({
    data: {
      ad,
      tip,
      buildingId,
      members: {
        create: [
          { userId: session.user.id },
          ...(memberIds || [])
            .filter((id: string) => id !== session.user.id)
            .map((id: string) => ({ userId: id })),
        ],
      },
    },
  });

  return NextResponse.json(room, { status: 201 });
}
