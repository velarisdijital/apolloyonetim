import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.buildingId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const kurallar = await prisma.cezaKurali.findMany({
    where: { buildingId: session.user.buildingId, aktif: true },
    orderBy: { siraNo: "asc" },
  });

  const daireler = ["MASTER_ADMIN", "KAPICI"].includes(session.user.rol)
    ? await prisma.apartment.findMany({
        where: { building: { id: session.user.buildingId } },
        orderBy: [{ kat: "asc" }, { no: "asc" }],
        select: { id: true, no: true, kat: true },
      })
    : [];

  return NextResponse.json({ kurallar, daireler });
}
