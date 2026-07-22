import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { oylamaSchema } from "@/lib/validations";
import { createBuildingNotification } from "@/lib/notifications";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const oylamalar = await prisma.poll.findMany({
    where: { buildingId: session.user.buildingId! },
    orderBy: { createdAt: "desc" },
    include: {
      votes: true,
      _count: { select: { votes: true } },
    },
  });

  return NextResponse.json(oylamalar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = oylamaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const oylama = await prisma.poll.create({
    data: {
      soru: parsed.data.soru,
      secenekler: JSON.stringify(parsed.data.secenekler),
      bitisTarihi: new Date(parsed.data.bitisTarihi),
      buildingId: session.user.buildingId!,
    },
  });

  await createBuildingNotification(
    session.user.buildingId!,
    {
      baslik: "Yeni Oylama",
      mesaj: `"${parsed.data.soru}" oylaması başlatıldı.`,
      tip: "oylama",
      link: "/oylamalar",
    },
    session.user.id
  );

  return NextResponse.json(oylama, { status: 201 });
}
