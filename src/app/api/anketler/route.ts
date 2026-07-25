import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBuildingNotification } from "@/lib/notifications";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const anketler = await prisma.anket.findMany({
    where: { buildingId: session.user.buildingId! },
    orderBy: { createdAt: "desc" },
    include: {
      sorular: {
        orderBy: { sira: "asc" },
        include: {
          _count: { select: { cevaplar: true } },
        },
      },
      _count: { select: { sorular: true } },
    },
  });

  return NextResponse.json(anketler);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { baslik, aciklama, bitisTarihi, anonim, sorular } = body;

  if (!baslik?.trim()) {
    return NextResponse.json({ error: "Baslik zorunludur" }, { status: 400 });
  }

  if (!bitisTarihi) {
    return NextResponse.json({ error: "Bitis tarihi zorunludur" }, { status: 400 });
  }

  if (!sorular || !Array.isArray(sorular) || sorular.length === 0) {
    return NextResponse.json({ error: "En az bir soru eklenmelidir" }, { status: 400 });
  }

  const anket = await prisma.anket.create({
    data: {
      baslik: baslik.trim(),
      aciklama: aciklama?.trim() || null,
      bitisTarihi: new Date(bitisTarihi),
      anonim: anonim || false,
      buildingId: session.user.buildingId!,
      sorular: {
        create: sorular.map((s: { soru: string; tip?: string; secenekler?: string; zorunlu?: boolean }, i: number) => ({
          soru: s.soru,
          tip: s.tip || "TEKLI",
          secenekler: s.secenekler || "[]",
          sira: i,
          zorunlu: s.zorunlu !== false,
        })),
      },
    },
    include: {
      sorular: { orderBy: { sira: "asc" } },
    },
  });

  await createBuildingNotification(
    session.user.buildingId!,
    {
      baslik: "Yeni Anket",
      mesaj: `"${baslik}" anketi yayinlandi.`,
      tip: "anket",
      link: "/anketler",
    },
    session.user.id
  );

  return NextResponse.json(anket, { status: 201 });
}
