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

  const ariza = await prisma.arizaBildirimi.findUnique({
    where: { id },
  });

  if (!ariza) {
    return NextResponse.json({ error: "Arıza bildirimi bulunamadı" }, { status: 404 });
  }

  if (ariza.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const updated = await prisma.arizaBildirimi.update({
    where: { id },
    data: {
      durum: body.durum,
      yanit: body.yanit,
    },
  });

  return NextResponse.json(updated);
}
