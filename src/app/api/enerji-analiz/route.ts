import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const rol = session.user.rol;
  if (rol !== "MASTER_ADMIN" && rol !== "DENETCI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const tip = searchParams.get("tip");
  const yil = searchParams.get("yil")
    ? parseInt(searchParams.get("yil")!)
    : new Date().getFullYear();

  const buildingId = session.user.buildingId!;

  // Fetch all meters for this building with their readings in the given year
  const sayacWhere: Record<string, unknown> = { buildingId };
  if (tip) sayacWhere.tip = tip;

  const sayaclar = await prisma.sayac.findMany({
    where: sayacWhere,
    include: {
      apartment: { select: { id: true, no: true } },
      okumalar: {
        where: {
          tarih: {
            gte: new Date(`${yil}-01-01`),
            lt: new Date(`${yil + 1}-01-01`),
          },
        },
        orderBy: { tarih: "asc" },
      },
    },
  });

  // Also fetch the last reading before the year starts for each meter (to calculate Jan consumption)
  const sayacIds = sayaclar.map((s) => s.id);
  const prevReadings = await prisma.sayacOkuma.findMany({
    where: {
      sayacId: { in: sayacIds },
      tarih: { lt: new Date(`${yil}-01-01`) },
    },
    orderBy: { tarih: "desc" },
    distinct: ["sayacId"],
  });

  const prevReadingMap = new Map<string, number>();
  for (const r of prevReadings) {
    prevReadingMap.set(r.sayacId, Number(r.deger));
  }

  const AY_ISIMLERI = [
    "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
    "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik",
  ];

  // Calculate monthly consumption per meter type
  type MonthlyData = {
    ay: number;
    ayAdi: string;
    tuketim: number;
  };

  type TipData = {
    tip: string;
    aylik: MonthlyData[];
    toplam: number;
    ortalama: number;
    enYuksekAy: string;
    enYuksekDeger: number;
    enDusukAy: string;
    enDusukDeger: number;
  };

  type DaireData = {
    daireNo: string;
    daireId: string;
    tip: string;
    aylik: MonthlyData[];
    toplam: number;
  };

  const tipMap = new Map<string, number[]>();
  const daireList: DaireData[] = [];

  for (const sayac of sayaclar) {
    const readings = sayac.okumalar;
    if (readings.length === 0) continue;

    const monthlyConsumption = new Array(12).fill(0);

    // Build a list of all readings including the previous year's last one
    const allReadings: { ay: number; deger: number }[] = [];

    const prevDeger = prevReadingMap.get(sayac.id);
    if (prevDeger !== undefined) {
      allReadings.push({ ay: -1, deger: prevDeger });
    }

    for (const okuma of readings) {
      const date = new Date(okuma.tarih);
      const ay = date.getMonth(); // 0-11
      allReadings.push({ ay, deger: Number(okuma.deger) });
    }

    // Calculate consumption as difference between consecutive readings
    for (let i = 1; i < allReadings.length; i++) {
      const diff = allReadings[i].deger - allReadings[i - 1].deger;
      if (diff > 0 && allReadings[i].ay >= 0) {
        monthlyConsumption[allReadings[i].ay] += diff;
      }
    }

    // Aggregate by tip
    const tipKey = sayac.tip;
    if (!tipMap.has(tipKey)) {
      tipMap.set(tipKey, new Array(12).fill(0));
    }
    const tipArr = tipMap.get(tipKey)!;
    for (let m = 0; m < 12; m++) {
      tipArr[m] += monthlyConsumption[m];
    }

    // Per-apartment data
    if (sayac.apartment) {
      daireList.push({
        daireNo: sayac.apartment.no,
        daireId: sayac.apartment.id,
        tip: sayac.tip,
        aylik: monthlyConsumption.map((val, idx) => ({
          ay: idx + 1,
          ayAdi: AY_ISIMLERI[idx],
          tuketim: Math.round(val * 100) / 100,
        })),
        toplam: Math.round(monthlyConsumption.reduce((a, b) => a + b, 0) * 100) / 100,
      });
    }
  }

  // Build tip summary
  const tipSummary: TipData[] = [];
  for (const [tipKey, months] of Array.from(tipMap.entries())) {
    const aylik: MonthlyData[] = months.map((val, idx) => ({
      ay: idx + 1,
      ayAdi: AY_ISIMLERI[idx],
      tuketim: Math.round(val * 100) / 100,
    }));

    const nonZeroMonths = aylik.filter((m) => m.tuketim > 0);
    const toplam = months.reduce((a, b) => a + b, 0);
    const ortalama = nonZeroMonths.length > 0 ? toplam / nonZeroMonths.length : 0;

    let enYuksek = aylik[0];
    let enDusuk = aylik[0];
    for (const m of aylik) {
      if (m.tuketim > enYuksek.tuketim) enYuksek = m;
      if (m.tuketim < enDusuk.tuketim || (enDusuk.tuketim === 0 && m.tuketim > 0)) enDusuk = m;
    }

    // Find lowest among months that have consumption
    const monthsWithData = aylik.filter((m) => m.tuketim > 0);
    if (monthsWithData.length > 0) {
      enDusuk = monthsWithData.reduce((min, m) => (m.tuketim < min.tuketim ? m : min), monthsWithData[0]);
    }

    tipSummary.push({
      tip: tipKey,
      aylik,
      toplam: Math.round(toplam * 100) / 100,
      ortalama: Math.round(ortalama * 100) / 100,
      enYuksekAy: enYuksek.ayAdi,
      enYuksekDeger: Math.round(enYuksek.tuketim * 100) / 100,
      enDusukAy: enDusuk.ayAdi,
      enDusukDeger: Math.round(enDusuk.tuketim * 100) / 100,
    });
  }

  // Year-over-year: fetch previous year total for comparison
  const prevYearReadings = await prisma.sayacOkuma.findMany({
    where: {
      buildingId,
      tarih: {
        gte: new Date(`${yil - 1}-01-01`),
        lt: new Date(`${yil}-01-01`),
      },
    },
    include: {
      sayac: { select: { tip: true } },
    },
    orderBy: { tarih: "asc" },
  });

  // Group prev year by sayac and calculate total
  const prevYearBySayac = new Map<string, number[]>();
  for (const r of prevYearReadings) {
    if (!prevYearBySayac.has(r.sayacId)) {
      prevYearBySayac.set(r.sayacId, []);
    }
    prevYearBySayac.get(r.sayacId)!.push(Number(r.deger));
  }

  const prevYearTotalByTip = new Map<string, number>();
  for (const r of prevYearReadings) {
    const vals = prevYearBySayac.get(r.sayacId);
    if (!vals || vals.length < 2) continue;
    const tipKey = r.sayac.tip;
    const consumption = vals[vals.length - 1] - vals[0];
    if (consumption > 0) {
      prevYearTotalByTip.set(tipKey, (prevYearTotalByTip.get(tipKey) || 0) + consumption);
    }
    // Prevent double counting
    prevYearBySayac.delete(r.sayacId);
  }

  const yillikDegisim: Record<string, number | null> = {};
  for (const ts of tipSummary) {
    const prevTotal = prevYearTotalByTip.get(ts.tip);
    if (prevTotal && prevTotal > 0) {
      yillikDegisim[ts.tip] = Math.round(((ts.toplam - prevTotal) / prevTotal) * 100 * 10) / 10;
    } else {
      yillikDegisim[ts.tip] = null;
    }
  }

  // Available years
  const firstReading = await prisma.sayacOkuma.findFirst({
    where: { buildingId },
    orderBy: { tarih: "asc" },
    select: { tarih: true },
  });

  const mevcutYillar: number[] = [];
  if (firstReading) {
    const startYear = new Date(firstReading.tarih).getFullYear();
    const currentYear = new Date().getFullYear();
    for (let y = startYear; y <= currentYear; y++) {
      mevcutYillar.push(y);
    }
  }
  if (mevcutYillar.length === 0) {
    mevcutYillar.push(new Date().getFullYear());
  }

  return NextResponse.json({
    yil,
    tipOzet: tipSummary,
    daireler: daireList,
    yillikDegisim,
    mevcutYillar,
  });
}
