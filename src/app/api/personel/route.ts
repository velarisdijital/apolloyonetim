import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const personeller = await prisma.personel.findMany({
    where: {
      buildingId: session.user.buildingId!,
      aktif: true,
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { maaslar: true } } },
  });

  return NextResponse.json(personeller);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { ad, soyad, gorev, telefon, maas, iseBaslama } = body;

  if (!ad || !ad.trim()) {
    return NextResponse.json({ error: "Ad zorunludur" }, { status: 400 });
  }

  if (!soyad || !soyad.trim()) {
    return NextResponse.json({ error: "Soyad zorunludur" }, { status: 400 });
  }

  if (!gorev) {
    return NextResponse.json({ error: "Gorev zorunludur" }, { status: 400 });
  }

  const personel = await prisma.personel.create({
    data: {
      ad: ad.trim(),
      soyad: soyad.trim(),
      gorev,
      telefon: telefon || null,
      maas: maas ? parseFloat(maas) : 0,
      iseBaslama: iseBaslama ? new Date(iseBaslama) : null,
      buildingId: session.user.buildingId!,
    },
  });

  return NextResponse.json(personel, { status: 201 });
}
