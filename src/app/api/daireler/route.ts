import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const daireler = await prisma.apartment.findMany({
    where: { buildingId: session.user.buildingId! },
    orderBy: [{ kat: "asc" }, { no: "asc" }],
    select: {
      id: true,
      no: true,
      kat: true,
    },
  });

  return NextResponse.json(daireler);
}
