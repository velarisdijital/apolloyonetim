import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const ayar = await prisma.aidatAyar.findUnique({
    where: { buildingId: session.user.buildingId! },
  });

  return NextResponse.json(ayar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { tutarKisi, metrekareGoreDagit, gecikmeFaiziOrani, sonOdemeGunu, otomatikOlustur, aciklama } = body;

  if (tutarKisi === undefined || tutarKisi === null || parseFloat(tutarKisi) < 0) {
    return NextResponse.json({ error: "Gecerli bir tutar giriniz" }, { status: 400 });
  }

  if (sonOdemeGunu < 1 || sonOdemeGunu > 28) {
    return NextResponse.json({ error: "Son odeme gunu 1-28 arasinda olmalidir" }, { status: 400 });
  }

  const ayar = await prisma.aidatAyar.upsert({
    where: { buildingId: session.user.buildingId! },
    update: {
      tutarKisi: parseFloat(tutarKisi),
      metrekareGoreDagit: !!metrekareGoreDagit,
      gecikmeFaiziOrani: parseFloat(gecikmeFaiziOrani || "5"),
      sonOdemeGunu: parseInt(sonOdemeGunu) || 15,
      otomatikOlustur: !!otomatikOlustur,
      aciklama: aciklama || null,
    },
    create: {
      buildingId: session.user.buildingId!,
      tutarKisi: parseFloat(tutarKisi),
      metrekareGoreDagit: !!metrekareGoreDagit,
      gecikmeFaiziOrani: parseFloat(gecikmeFaiziOrani || "5"),
      sonOdemeGunu: parseInt(sonOdemeGunu) || 15,
      otomatikOlustur: !!otomatikOlustur,
      aciklama: aciklama || null,
    },
  });

  return NextResponse.json(ayar);
}
