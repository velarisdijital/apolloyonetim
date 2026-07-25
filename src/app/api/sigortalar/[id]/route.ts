import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const existing = await prisma.sigortaPolice.findUnique({
      where: { id },
    });

    if (!existing || existing.buildingId !== buildingId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const { tip, sirketAdi, policeNo, baslangicTarihi, bitisTarihi, primTutari, kapsam, not } = body;

    const sigortaPolice = await prisma.sigortaPolice.update({
      where: { id },
      data: {
        tip: tip || existing.tip,
        sirketAdi: sirketAdi || existing.sirketAdi,
        policeNo: policeNo !== undefined ? policeNo || null : existing.policeNo,
        baslangicTarihi: baslangicTarihi ? new Date(baslangicTarihi) : existing.baslangicTarihi,
        bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : existing.bitisTarihi,
        primTutari: primTutari !== undefined ? (primTutari ? parseFloat(primTutari) : null) : existing.primTutari,
        kapsam: kapsam !== undefined ? kapsam || null : existing.kapsam,
        not: not !== undefined ? not || null : existing.not,
      },
    });

    return NextResponse.json(sigortaPolice);
  } catch (error) {
    console.error("Sigorta PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const existing = await prisma.sigortaPolice.findUnique({
      where: { id },
    });

    if (!existing || existing.buildingId !== buildingId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.sigortaPolice.update({
      where: { id },
      data: { aktif: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sigorta DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
