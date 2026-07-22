import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBuildingNotification } from "@/lib/notifications";
import { KATEGORI_LABELS } from "@/lib/constants";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (!["MASTER_ADMIN", "DENETCI"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { onayDurumu, onayNotu } = body;

  if (!["ONAYLANDI", "REDDEDILDI"].includes(onayDurumu)) {
    return NextResponse.json({ error: "Geçersiz onay durumu" }, { status: 400 });
  }

  const gider = await prisma.expense.findUnique({
    where: { id },
    include: { createdBy: { select: { id: true, ad: true, soyad: true } } },
  });

  if (!gider) {
    return NextResponse.json({ error: "Gider bulunamadı" }, { status: 404 });
  }

  if (gider.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      onayDurumu: onayDurumu as never,
      onayNotu: onayNotu || null,
      onaylayanId: session.user.id,
    },
  });

  if (onayDurumu === "ONAYLANDI") {
    await createBuildingNotification(
      session.user.buildingId!,
      {
        baslik: "Gider Onaylandı",
        mesaj: `${KATEGORI_LABELS[gider.kategori]}: ${gider.tutar} TL - ${gider.aciklama}`,
        tip: "gider",
        link: "/giderler",
      },
      session.user.id
    );
  }

  await prisma.notification.create({
    data: {
      baslik: onayDurumu === "ONAYLANDI" ? "Gideriniz Onaylandı" : "Gideriniz Reddedildi",
      mesaj: `${gider.aciklama} - ${onayNotu || ""}`.trim(),
      tip: "onay",
      link: "/giderler",
      userId: gider.createdById,
    },
  });

  return NextResponse.json(updated);
}
