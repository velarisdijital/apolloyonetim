import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { arizaSchema } from "@/lib/validations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const arizalar = await prisma.arizaBildirimi.findMany({
    where: { buildingId: session.user.buildingId! },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(arizalar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const parsed = arizaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const ariza = await prisma.arizaBildirimi.create({
    data: {
      baslik: parsed.data.baslik,
      aciklama: parsed.data.aciklama,
      konum: parsed.data.konum,
      oncelik: parsed.data.oncelik || "NORMAL",
      fotograflar: parsed.data.fotograflar || [],
      tahminiMaliyet: parsed.data.tahminiMaliyet,
      buildingId: session.user.buildingId!,
      userId: session.user.id,
    },
  });

  return NextResponse.json(ariza, { status: 201 });
}
