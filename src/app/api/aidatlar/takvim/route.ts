import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const yil = parseInt(searchParams.get("yil") || new Date().getFullYear().toString());
  const buildingId = session.user.buildingId!;
  const isAdmin = ["MASTER_ADMIN", "KAPICI", "DENETCI"].includes(session.user.rol);

  const aidatlar = await prisma.dues.findMany({
    where: { buildingId, yil },
    orderBy: { ay: "asc" },
    include: {
      items: {
        include: {
          apartment: { select: { id: true, no: true, kat: true } },
          payments: {
            include: {
              user: { select: { id: true, ad: true, soyad: true } },
            },
            orderBy: { tarih: "desc" },
          },
        },
        ...(isAdmin ? {} : { where: { apartmentId: session.user.apartmentId! } }),
      },
    },
  });

  const daireler = isAdmin
    ? await prisma.apartment.findMany({
        where: { buildingId },
        orderBy: { no: "asc" },
        select: { id: true, no: true, kat: true },
      })
    : [];

  const bekleyenSayisi = isAdmin
    ? await prisma.payment.count({
        where: {
          onayDurumu: "BEKLEMEDE",
          duesItem: { dues: { buildingId } },
        },
      })
    : 0;

  return NextResponse.json({ aidatlar, daireler, yil, bekleyenSayisi });
}
