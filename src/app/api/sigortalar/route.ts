import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const buildingId = session.user.buildingId;
    if (!buildingId) {
      return NextResponse.json({ error: "Building not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const tip = searchParams.get("tip");

    const where: Record<string, unknown> = {
      buildingId,
      aktif: true,
    };

    if (tip) {
      where.tip = tip;
    }

    const sigortalar = await prisma.sigortaPolice.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sigortalar);
  } catch (error) {
    console.error("Sigortalar GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.rol !== "MASTER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const buildingId = session.user.buildingId;
    if (!buildingId) {
      return NextResponse.json({ error: "Building not found" }, { status: 400 });
    }

    const body = await request.json();
    const { tip, sirketAdi, policeNo, baslangicTarihi, bitisTarihi, primTutari, kapsam, not } = body;

    if (!tip || !sirketAdi) {
      return NextResponse.json(
        { error: "Tip ve sirket adi zorunludur" },
        { status: 400 }
      );
    }

    const sigortaPolice = await prisma.sigortaPolice.create({
      data: {
        tip,
        sirketAdi,
        policeNo: policeNo || null,
        baslangicTarihi: baslangicTarihi ? new Date(baslangicTarihi) : new Date(),
        bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : new Date(),
        primTutari: primTutari ? parseFloat(primTutari) : null,
        kapsam: kapsam || null,
        not: not || null,
        buildingId,
      },
    });

    return NextResponse.json(sigortaPolice, { status: 201 });
  } catch (error) {
    console.error("Sigortalar POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
