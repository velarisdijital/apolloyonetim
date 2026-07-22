import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { duyuruSchema } from "@/lib/validations";
import { createBuildingNotification } from "@/lib/notifications";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const duyurular = await prisma.announcement.findMany({
    where: { buildingId: session.user.buildingId! },
    orderBy: [{ onemli: "desc" }, { createdAt: "desc" }],
    include: {
      createdBy: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(duyurular);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = duyuruSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const duyuru = await prisma.announcement.create({
    data: {
      baslik: parsed.data.baslik,
      icerik: parsed.data.icerik,
      onemli: parsed.data.onemli ?? false,
      buildingId: session.user.buildingId!,
      createdById: session.user.id,
    },
  });

  await createBuildingNotification(
    session.user.buildingId!,
    {
      baslik: parsed.data.onemli ? "Önemli Duyuru" : "Yeni Duyuru",
      mesaj: parsed.data.baslik,
      tip: "duyuru",
      link: "/duyurular",
    },
    session.user.id
  );

  return NextResponse.json(duyuru, { status: 201 });
}
