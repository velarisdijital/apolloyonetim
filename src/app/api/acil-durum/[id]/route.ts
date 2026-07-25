import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const acilDurum = await prisma.acilDurum.findUnique({
    where: { id },
  });

  if (!acilDurum) {
    return NextResponse.json({ error: "Acil durum bildirimi bulunamadi" }, { status: 404 });
  }

  if (acilDurum.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const updated = await prisma.acilDurum.update({
    where: { id },
    data: {
      cozuldu: true,
      cozumNotu: body.cozumNotu || null,
    },
  });

  return NextResponse.json(updated);
}
