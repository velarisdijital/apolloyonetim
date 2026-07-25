import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const sayaclar = await prisma.sayac.findMany({
    where: { buildingId: session.user.buildingId! },
    orderBy: { createdAt: "desc" },
    include: {
      apartment: { select: { no: true } },
      okumalar: {
        orderBy: { tarih: "desc" },
        take: 2,
        include: {
          okuyan: { select: { ad: true, soyad: true } },
        },
      },
    },
  });

  return NextResponse.json(sayaclar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const rol = session.user.rol;
  if (rol !== "MASTER_ADMIN" && rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { tip, sayacNo, konum, apartmentId } = body;

  if (!tip || !sayacNo) {
    return NextResponse.json(
      { error: "Sayaç tipi ve numarası zorunludur" },
      { status: 400 }
    );
  }

  if (!["SU", "ELEKTRIK", "DOGALGAZ"].includes(tip)) {
    return NextResponse.json(
      { error: "Geçersiz sayaç tipi" },
      { status: 400 }
    );
  }

  try {
    const sayac = await prisma.sayac.create({
      data: {
        tip,
        sayacNo,
        konum: konum || null,
        buildingId: session.user.buildingId!,
        apartmentId: apartmentId || null,
      },
    });

    return NextResponse.json(sayac, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Bu sayaç numarası zaten kayıtlı" },
        { status: 409 }
      );
    }
    throw error;
  }
}
