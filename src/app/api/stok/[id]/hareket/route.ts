import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  const hareketler = await prisma.stokHareket.findMany({
    where: { malzemeId: id, buildingId: session.user.buildingId! },
    orderBy: { createdAt: "desc" },
    include: {
      islemYapan: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(hareketler);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { tip, miktar, aciklama } = body;

  if (!tip || !["GIRIS", "CIKIS"].includes(tip)) {
    return NextResponse.json({ error: "Geçersiz hareket tipi" }, { status: 400 });
  }

  if (!miktar || parseFloat(miktar) <= 0) {
    return NextResponse.json({ error: "Miktar sıfırdan büyük olmalıdır" }, { status: 400 });
  }

  const malzeme = await prisma.stokMalzeme.findUnique({ where: { id } });

  if (!malzeme) {
    return NextResponse.json({ error: "Malzeme bulunamadı" }, { status: 404 });
  }

  if (malzeme.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const miktarDecimal = parseFloat(miktar);

  if (tip === "CIKIS" && Number(malzeme.miktar) < miktarDecimal) {
    return NextResponse.json({ error: "Yetersiz stok" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const hareket = await tx.stokHareket.create({
      data: {
        tip,
        miktar: miktarDecimal,
        aciklama: aciklama || null,
        malzemeId: id,
        buildingId: session.user.buildingId!,
        islemYapanId: session.user.id,
      },
      include: {
        islemYapan: { select: { ad: true, soyad: true } },
      },
    });

    const yeniMiktar = tip === "GIRIS"
      ? Number(malzeme.miktar) + miktarDecimal
      : Number(malzeme.miktar) - miktarDecimal;

    await tx.stokMalzeme.update({
      where: { id },
      data: { miktar: yeniMiktar },
    });

    return hareket;
  });

  return NextResponse.json(result, { status: 201 });
}
