import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { aidatSchema } from "@/lib/validations";
import { createBuildingNotification } from "@/lib/notifications";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  // Bug 2 fix: Mark overdue unpaid items as GECIKTI before fetching
  await prisma.duesItem.updateMany({
    where: {
      durum: 'ODENMEDI',
      dues: {
        sonOdemeTarihi: { lt: new Date() },
        buildingId: session.user.buildingId!,
      },
    },
    data: { durum: 'GECIKTI' },
  });

  const aidatlar = await prisma.dues.findMany({
    where: { buildingId: session.user.buildingId! },
    orderBy: [{ yil: "desc" }, { ay: "desc" }],
    include: {
      items: {
        include: {
          apartment: { select: { id: true, no: true, kat: true } },
          payments: true,
        },
      },
    },
  });

  return NextResponse.json(aidatlar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = aidatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const apartments = await prisma.apartment.findMany({
    where: { buildingId: session.user.buildingId! },
    select: { id: true },
  });

  let aidat;
  try {
    aidat = await prisma.dues.create({
      data: {
        ay: parsed.data.ay,
        yil: parsed.data.yil,
        tutarKisi: parsed.data.tutarKisi,
        aciklama: parsed.data.aciklama,
        sonOdemeTarihi: new Date(parsed.data.sonOdemeTarihi),
        buildingId: session.user.buildingId!,
        items: {
          create: apartments.map((apt) => ({
            apartmentId: apt.id,
          })),
        },
      },
      include: { items: true },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Bu ay ve yıl için zaten bir aidat tanımlanmış." },
        { status: 409 }
      );
    }
    throw error;
  }

  await createBuildingNotification(
    session.user.buildingId!,
    {
      baslik: "Yeni Aidat Dönemi",
      mesaj: `${parsed.data.ay}/${parsed.data.yil} dönemi için ${parsed.data.tutarKisi} TL aidat tanımlandı.`,
      tip: "aidat",
      link: "/aidatlar",
    },
    session.user.id
  );

  return NextResponse.json(aidat, { status: 201 });
}
