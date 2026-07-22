import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ay = parseInt(searchParams.get("ay") || String(new Date().getMonth() + 1));
  const yil = parseInt(searchParams.get("yil") || String(new Date().getFullYear()));
  const buildingId = session.user.buildingId!;

  // 1. Expenses grouped by category (pie chart)
  const giderlerByKategori = await prisma.expense.groupBy({
    by: ["kategori"],
    where: {
      buildingId,
      tarih: {
        gte: new Date(yil, ay - 1, 1),
        lt: new Date(yil, ay, 1),
      },
    },
    _sum: { tutar: true },
  });

  // 2. Monthly totals for last 12 months (trend chart)
  const now = new Date(yil, ay - 1, 1);
  const twelveMonthsAgo = new Date(yil, ay - 13, 1);

  const aylikGiderler = await prisma.expense.findMany({
    where: {
      buildingId,
      tarih: { gte: twelveMonthsAgo, lt: new Date(yil, ay, 1) },
    },
    select: { tutar: true, tarih: true },
  });

  const aylikToplamlar: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    aylikToplamlar[key] = 0;
  }

  for (const g of aylikGiderler) {
    const d = new Date(g.tarih);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in aylikToplamlar) {
      aylikToplamlar[key] += Number(g.tutar);
    }
  }

  const trendVerisi = Object.entries(aylikToplamlar)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ay, toplam]) => ({ ay, toplam }));

  // 3. Dues collection summary
  const aidatDonem = await prisma.dues.findUnique({
    where: { buildingId_ay_yil: { buildingId, ay, yil } },
    include: {
      items: {
        include: { payments: true },
      },
    },
  });

  const aidatOzet = {
    toplamDaire: 0,
    odpisMis: 0,
    kismiOdemis: 0,
    odenmemis: 0,
    toplamTahsilat: 0,
    toplamBeklenen: 0,
  };

  if (aidatDonem) {
    aidatOzet.toplamDaire = aidatDonem.items.length;
    aidatOzet.toplamBeklenen = aidatDonem.items.length * Number(aidatDonem.tutarKisi);

    for (const item of aidatDonem.items) {
      const odemeToplam = item.payments.reduce((s, p) => s + Number(p.tutar), 0);
      aidatOzet.toplamTahsilat += odemeToplam;

      if (item.durum === "ODENDI") aidatOzet.odpisMis++;
      else if (item.durum === "KISMI") aidatOzet.kismiOdemis++;
      else aidatOzet.odenmemis++;
    }
  }

  return NextResponse.json({
    giderlerByKategori: giderlerByKategori.map((g) => ({
      kategori: g.kategori,
      toplam: Number(g._sum.tutar) || 0,
    })),
    trendVerisi,
    aidatOzet,
  });
}
