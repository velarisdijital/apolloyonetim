import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const hayvanlar = await prisma.evcilHayvan.findMany({
    where: { buildingId: session.user.buildingId! },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, ad: true, soyad: true } },
      apartment: { select: { no: true } },
    },
  });

  return NextResponse.json(hayvanlar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();

  const { ad, tur, cins, yas, asiDurumu, asiTarihi, chipNo, not, apartmentId } = body;

  if (!ad || !tur) {
    return NextResponse.json({ error: "Ad ve tür zorunludur" }, { status: 400 });
  }

  const hayvan = await prisma.evcilHayvan.create({
    data: {
      ad,
      tur,
      cins: cins || null,
      yas: yas ? parseInt(yas, 10) : null,
      asiDurumu: asiDurumu || false,
      asiTarihi: asiTarihi ? new Date(asiTarihi) : null,
      chipNo: chipNo || null,
      not: not || null,
      apartmentId: apartmentId || session.user.apartmentId || null,
      buildingId: session.user.buildingId!,
      userId: session.user.id,
    },
  });

  return NextResponse.json(hayvan, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const hayvan = await prisma.evcilHayvan.findUnique({ where: { id } });
  if (!hayvan) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  if (hayvan.userId !== session.user.id && session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  await prisma.evcilHayvan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
