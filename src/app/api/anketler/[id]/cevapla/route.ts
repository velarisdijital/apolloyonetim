import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { cevaplar } = body;

  if (!cevaplar || !Array.isArray(cevaplar) || cevaplar.length === 0) {
    return NextResponse.json({ error: "Cevaplar zorunludur" }, { status: 400 });
  }

  const anket = await prisma.anket.findUnique({
    where: { id },
    include: { sorular: true },
  });

  if (!anket) {
    return NextResponse.json({ error: "Anket bulunamadi" }, { status: 404 });
  }

  if (anket.durum !== "AKTIF") {
    return NextResponse.json({ error: "Bu anket artik aktif degil" }, { status: 400 });
  }

  if (new Date() > anket.bitisTarihi) {
    return NextResponse.json({ error: "Anket suresi dolmus" }, { status: 400 });
  }

  const soruIds = anket.sorular.map((s) => s.id);
  for (const c of cevaplar) {
    if (!soruIds.includes(c.soruId)) {
      return NextResponse.json({ error: "Gecersiz soru ID" }, { status: 400 });
    }
  }

  const zorunluSorular = anket.sorular.filter((s) => s.zorunlu);
  for (const soru of zorunluSorular) {
    const cevap = cevaplar.find((c: { soruId: string; cevap: string }) => c.soruId === soru.id);
    if (!cevap || !cevap.cevap?.trim()) {
      return NextResponse.json({ error: `"${soru.soru}" sorusu zorunludur` }, { status: 400 });
    }
  }

  const results = await prisma.$transaction(
    cevaplar.map((c: { soruId: string; cevap: string }) =>
      prisma.anketCevap.upsert({
        where: {
          soruId_userId: {
            soruId: c.soruId,
            userId: session.user.id,
          },
        },
        update: { cevap: c.cevap },
        create: {
          cevap: c.cevap,
          soruId: c.soruId,
          userId: session.user.id,
        },
      })
    )
  );

  return NextResponse.json(results, { status: 201 });
}
