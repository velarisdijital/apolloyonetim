import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

async function cleanupOldRecords(buildingId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const oldRecords = await prisma.temizlikKayit.findMany({
    where: {
      buildingId,
      tarih: { lt: thirtyDaysAgo },
    },
  });

  for (const record of oldRecords) {
    try {
      const fotograflar: string[] = JSON.parse(record.fotograflar || "[]");
      for (const foto of fotograflar) {
        try {
          await unlink(path.join(process.cwd(), "public", foto));
        } catch {
          // File may already be gone
        }
      }
    } catch {
      // JSON parse error
    }
  }

  if (oldRecords.length > 0) {
    await prisma.temizlikKayit.deleteMany({
      where: {
        buildingId,
        tarih: { lt: thirtyDaysAgo },
      },
    });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const baslangic = searchParams.get("baslangic");
  const bitis = searchParams.get("bitis");

  const where: Record<string, unknown> = {
    buildingId: session.user.buildingId!,
  };

  if (baslangic || bitis) {
    const tarihFilter: Record<string, Date> = {};
    if (baslangic) tarihFilter.gte = new Date(baslangic);
    if (bitis) tarihFilter.lte = new Date(bitis);
    where.tarih = tarihFilter;
  }

  // Cleanup old records on every GET call
  await cleanupOldRecords(session.user.buildingId!);

  const kayitlar = await prisma.temizlikKayit.findMany({
    where,
    orderBy: { tarih: "desc" },
    include: {
      yukleyen: {
        select: { id: true, ad: true, soyad: true },
      },
    },
  });

  return NextResponse.json(kayitlar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { alan, fotograflar, not: notText } = body;

  if (!alan || !alan.trim()) {
    return NextResponse.json({ error: "Alan zorunludur" }, { status: 400 });
  }

  const kayit = await prisma.temizlikKayit.create({
    data: {
      alan: alan.trim(),
      fotograflar: JSON.stringify(fotograflar || []),
      not: notText || null,
      buildingId: session.user.buildingId!,
      yukleyenId: session.user.id,
    },
  });

  return NextResponse.json(kayit, { status: 201 });
}
