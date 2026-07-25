import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teslimEdildi = searchParams.get("teslimEdildi");

  const where: Record<string, unknown> = {
    buildingId: session.user.buildingId!,
  };

  if (teslimEdildi === "true") where.teslimEdildi = true;
  if (teslimEdildi === "false") where.teslimEdildi = false;

  const paketler = await prisma.paketKargo.findMany({
    where,
    include: {
      alici: { select: { id: true, ad: true, soyad: true } },
      teslimEden: { select: { id: true, ad: true, soyad: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(paketler);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { aliciAdi, daireBilgisi, kargoFirmasi, takipNo, not: notText } = body;

  if (!aliciAdi || !aliciAdi.trim()) {
    return NextResponse.json({ error: "Alici adi zorunludur" }, { status: 400 });
  }

  if (!daireBilgisi || !daireBilgisi.trim()) {
    return NextResponse.json({ error: "Daire bilgisi zorunludur" }, { status: 400 });
  }

  const paket = await prisma.paketKargo.create({
    data: {
      aliciAdi: aliciAdi.trim(),
      daireBilgisi: daireBilgisi.trim(),
      kargoFirmasi: kargoFirmasi || null,
      takipNo: takipNo || null,
      not: notText || null,
      teslimEdenId: session.user.id,
      buildingId: session.user.buildingId!,
    },
  });

  return NextResponse.json(paket, { status: 201 });
}
