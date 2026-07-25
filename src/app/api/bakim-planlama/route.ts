import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const durum = searchParams.get("durum");

  const where: Record<string, unknown> = {
    buildingId: session.user.buildingId!,
  };
  if (durum) where.durum = durum;

  const bakimlar = await prisma.periyodikBakim.findMany({
    where,
    orderBy: { sonrakiBakimTarihi: "asc" },
    include: {
      demirbas: { select: { ad: true, kategori: true } },
    },
  });

  return NextResponse.json(bakimlar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { baslik, aciklama, periyotGun, sonBakimTarihi, demirbasId } = body;

  if (!baslik || !baslik.trim()) {
    return NextResponse.json({ error: "Başlık zorunludur" }, { status: 400 });
  }

  if (!periyotGun || periyotGun < 1) {
    return NextResponse.json({ error: "Periyot gün geçerli olmalıdır" }, { status: 400 });
  }

  const now = sonBakimTarihi ? new Date(sonBakimTarihi) : new Date();
  const sonraki = new Date(now);
  sonraki.setDate(sonraki.getDate() + parseInt(periyotGun));

  const bakim = await prisma.periyodikBakim.create({
    data: {
      baslik: baslik.trim(),
      aciklama: aciklama || null,
      periyotGun: parseInt(periyotGun),
      sonBakimTarihi: sonBakimTarihi ? new Date(sonBakimTarihi) : null,
      sonrakiBakimTarihi: sonraki,
      buildingId: session.user.buildingId!,
      demirbasId: demirbasId || null,
    },
  });

  return NextResponse.json(bakim, { status: 201 });
}
