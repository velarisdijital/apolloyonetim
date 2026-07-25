import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.buildingId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const yil = parseInt(searchParams.get("yil") || new Date().getFullYear().toString());
  const ay = searchParams.get("ay") ? parseInt(searchParams.get("ay")!) : undefined;
  const durum = searchParams.get("durum") || undefined;

  const isAdmin = ["MASTER_ADMIN", "KAPICI"].includes(session.user.rol);

  const where: Record<string, unknown> = {
    buildingId: session.user.buildingId,
    createdAt: {
      gte: new Date(yil, ay ? ay - 1 : 0, 1),
      lt: new Date(yil, ay ? ay : 12, 1),
    },
  };

  if (durum) {
    where.durum = durum;
  }

  if (!isAdmin) {
    where.apartmentId = session.user.apartmentId;
  }

  const ihlaller = await prisma.ihlal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      kural: { select: { siraNo: true, eylem: true, kademe: true, cezaOrani: true } },
      apartment: { select: { id: true, no: true, kat: true } },
      bildiren: { select: { id: true, ad: true, soyad: true } },
      onaylayan: { select: { id: true, ad: true, soyad: true } },
    },
  });

  const apartmentId = isAdmin ? undefined : session.user.apartmentId;
  const ozet = await getIhlalOzet(session.user.buildingId, yil, apartmentId ?? undefined);

  return NextResponse.json({ ihlaller, ozet, isAdmin });
}

async function getIhlalOzet(buildingId: string, yil: number, apartmentId?: string) {
  const where: Record<string, unknown> = {
    buildingId,
    createdAt: {
      gte: new Date(yil, 0, 1),
      lt: new Date(yil + 1, 0, 1),
    },
  };
  if (apartmentId) where.apartmentId = apartmentId;

  const [toplam, uyari, ceza, bekleyen] = await Promise.all([
    prisma.ihlal.count({ where }),
    prisma.ihlal.count({ where: { ...where, durum: "UYARI_VERILDI" } }),
    prisma.ihlal.count({ where: { ...where, durum: "CEZA_VERILDI" } }),
    prisma.ihlal.count({ where: { ...where, durum: "BILDIRILDI" } }),
  ]);

  return { toplam, uyari, ceza, bekleyen };
}
