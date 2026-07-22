import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toplantiSchema } from "@/lib/validations";
import { createBuildingNotification } from "@/lib/notifications";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const toplantilar = await prisma.meeting.findMany({
    where: { buildingId: session.user.buildingId! },
    orderBy: { tarih: "desc" },
    include: {
      createdBy: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(toplantilar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = toplantiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const toplanti = await prisma.meeting.create({
    data: {
      baslik: parsed.data.baslik,
      tarih: new Date(parsed.data.tarih),
      icerik: parsed.data.icerik,
      katilimcilar: parsed.data.katilimcilar,
      buildingId: session.user.buildingId!,
      createdById: session.user.id,
    },
  });

  await createBuildingNotification(
    session.user.buildingId!,
    {
      baslik: "Yeni Toplantı",
      mesaj: `"${parsed.data.baslik}" toplantısı oluşturuldu.`,
      tip: "toplanti",
      link: "/toplantilar",
    },
    session.user.id
  );

  return NextResponse.json(toplanti, { status: 201 });
}
