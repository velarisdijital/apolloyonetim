import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  const oylama = await prisma.poll.findUnique({
    where: { id },
    include: {
      votes: {
        include: {
          user: { select: { id: true, ad: true, soyad: true } },
        },
      },
    },
  });

  if (!oylama) {
    return NextResponse.json({ error: "Oylama bulunamadı" }, { status: 404 });
  }

  return NextResponse.json(oylama);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { secenek } = body;

  if (secenek === undefined || typeof secenek !== "number") {
    return NextResponse.json({ error: "Geçerli bir seçenek belirtin" }, { status: 400 });
  }

  const poll = await prisma.poll.findUnique({ where: { id } });
  if (!poll) {
    return NextResponse.json({ error: "Oylama bulunamadı" }, { status: 404 });
  }

  if (poll.durum !== "AKTIF") {
    return NextResponse.json({ error: "Bu oylama artık aktif değil" }, { status: 400 });
  }

  const existingVote = await prisma.vote.findUnique({
    where: { pollId_userId: { pollId: id, userId: session.user.id } },
  });

  if (existingVote) {
    return NextResponse.json({ error: "Bu oylamada zaten oy kullandınız" }, { status: 409 });
  }

  const vote = await prisma.vote.create({
    data: {
      secenek,
      pollId: id,
      userId: session.user.id,
    },
  });

  return NextResponse.json(vote, { status: 201 });
}
