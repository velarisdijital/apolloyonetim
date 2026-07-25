import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const durum = searchParams.get("durum");
  const kategori = searchParams.get("kategori");

  const where: Record<string, unknown> = {
    buildingId: session.user.buildingId!,
  };

  if (durum) where.durum = durum;
  if (kategori) where.kategori = kategori;

  const sikayetler = await prisma.sikayet.findMany({
    where,
    include: {
      bildiren: {
        select: { id: true, ad: true, soyad: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const isAdmin = session.user.rol === "MASTER_ADMIN";

  const result = sikayetler.map((s) => {
    if (s.anonim && !isAdmin) {
      return { ...s, bildiren: null };
    }
    return s;
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { kategori, baslik, aciklama, anonim } = body;

  if (!baslik || !baslik.trim()) {
    return NextResponse.json({ error: "Baslik zorunludur" }, { status: 400 });
  }

  if (!aciklama || !aciklama.trim()) {
    return NextResponse.json({ error: "Aciklama zorunludur" }, { status: 400 });
  }

  const sikayet = await prisma.sikayet.create({
    data: {
      kategori: kategori || "Diger",
      baslik: baslik.trim(),
      aciklama: aciklama.trim(),
      anonim: anonim || false,
      durum: "YENI",
      bildirenId: session.user.id,
      buildingId: session.user.buildingId!,
    },
  });

  return NextResponse.json(sikayet, { status: 201 });
}
