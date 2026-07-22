import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { roomId } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");

  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: { id: true, ad: true, tip: true, buildingId: true },
  });

  if (!room || room.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { chatRoomId: roomId },
    orderBy: { createdAt: "desc" },
    take: 50,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      sender: { select: { id: true, ad: true, soyad: true, rol: true } },
    },
  });

  await prisma.chatRoomMember.upsert({
    where: { chatRoomId_userId: { chatRoomId: roomId, userId: session.user.id } },
    update: { sonOkunma: new Date() },
    create: { chatRoomId: roomId, userId: session.user.id, sonOkunma: new Date() },
  });

  return NextResponse.json({
    room,
    messages: messages.reverse(),
    hasMore: messages.length === 50,
    nextCursor: messages.length === 50 ? messages[0].id : null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { roomId } = await params;
  const body = await req.json();
  const { icerik } = body;

  if (!icerik || !icerik.trim()) {
    return NextResponse.json({ error: "Mesaj boş olamaz" }, { status: 400 });
  }

  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: { buildingId: true },
  });

  if (!room || room.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      icerik: icerik.trim(),
      chatRoomId: roomId,
      senderId: session.user.id,
    },
    include: {
      sender: { select: { id: true, ad: true, soyad: true, rol: true } },
    },
  });

  await prisma.chatRoom.update({
    where: { id: roomId },
    data: { updatedAt: new Date() },
  });

  await prisma.chatRoomMember.upsert({
    where: { chatRoomId_userId: { chatRoomId: roomId, userId: session.user.id } },
    update: { sonOkunma: new Date() },
    create: { chatRoomId: roomId, userId: session.user.id, sonOkunma: new Date() },
  });

  return NextResponse.json(message, { status: 201 });
}
