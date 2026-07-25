import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBuildingNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.buildingId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  if (!["MASTER_ADMIN", "KAPICI"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { kuralId, apartmentId, aciklama, kanitYollari } = body;

  if (!kuralId || !apartmentId || !aciklama) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const kural = await prisma.cezaKurali.findUnique({ where: { id: kuralId } });
  if (!kural) {
    return NextResponse.json({ error: "Kural bulunamadı" }, { status: 404 });
  }

  const ihlal = await prisma.ihlal.create({
    data: {
      aciklama,
      kanitYollari: kanitYollari || [],
      kuralId,
      apartmentId,
      bildirenId: session.user.id,
      buildingId: session.user.buildingId,
    },
    include: {
      apartment: { select: { no: true } },
      kural: { select: { siraNo: true, eylem: true } },
    },
  });

  await createBuildingNotification(
    session.user.buildingId,
    {
      baslik: "Yeni Kural İhlali Bildirimi",
      mesaj: `Daire ${ihlal.apartment.no} için kural ihlali bildirildi: ${ihlal.kural.eylem.substring(0, 80)}...`,
      tip: "ceza",
      link: "/cezalar",
    },
    session.user.id,
    ["MASTER_ADMIN"]
  );

  return NextResponse.json(ihlal, { status: 201 });
}
