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

  const ziyaretci = await prisma.ziyaretci.findUnique({
    where: { id },
  });

  if (!ziyaretci) {
    return NextResponse.json({ error: "Ziyaretçi kaydı bulunamadı" }, { status: 404 });
  }

  if (ziyaretci.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.cikisTarihi !== undefined) {
    updateData.cikisTarihi = body.cikisTarihi ? new Date(body.cikisTarihi) : new Date();
  }

  if (body.teslimAlindi !== undefined) {
    updateData.teslimAlindi = body.teslimAlindi;
  }

  const updated = await prisma.ziyaretci.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}
