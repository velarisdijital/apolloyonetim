import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const sayacId = req.nextUrl.searchParams.get("sayacId");
  if (!sayacId) {
    return NextResponse.json(
      { error: "sayacId parametresi zorunludur" },
      { status: 400 }
    );
  }

  const okumalar = await prisma.sayacOkuma.findMany({
    where: {
      sayacId,
      buildingId: session.user.buildingId!,
    },
    orderBy: { tarih: "desc" },
    include: {
      okuyan: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(okumalar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { sayacId, deger, fotografYolu, not: okumaNote } = body;

  if (!sayacId || deger === undefined || deger === null) {
    return NextResponse.json(
      { error: "sayacId ve deger zorunludur" },
      { status: 400 }
    );
  }

  const numericDeger = parseFloat(deger);
  if (isNaN(numericDeger) || numericDeger < 0) {
    return NextResponse.json(
      { error: "Geçersiz sayaç değeri" },
      { status: 400 }
    );
  }

  // Verify the meter belongs to user's building
  const sayac = await prisma.sayac.findFirst({
    where: {
      id: sayacId,
      buildingId: session.user.buildingId!,
    },
  });

  if (!sayac) {
    return NextResponse.json(
      { error: "Sayaç bulunamadı" },
      { status: 404 }
    );
  }

  const okuma = await prisma.sayacOkuma.create({
    data: {
      deger: numericDeger,
      sayacId,
      buildingId: session.user.buildingId!,
      okuyanId: session.user.id,
      fotografYolu: fotografYolu || null,
      not: okumaNote || null,
    },
    include: {
      okuyan: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(okuma, { status: 201 });
}
