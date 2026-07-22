import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { giderSchema } from "@/lib/validations";
import { createBuildingNotification } from "@/lib/notifications";
import { KATEGORI_LABELS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kategori = searchParams.get("kategori");
  const baslangic = searchParams.get("baslangic");
  const bitis = searchParams.get("bitis");
  const onayDurumu = searchParams.get("onayDurumu");

  const where: Record<string, unknown> = { buildingId: session.user.buildingId };
  if (kategori) where.kategori = kategori;
  if (baslangic && bitis) {
    where.tarih = { gte: new Date(baslangic), lte: new Date(bitis) };
  }

  if (["MASTER_ADMIN", "DENETCI"].includes(session.user.rol)) {
    if (onayDurumu) where.onayDurumu = onayDurumu;
  } else {
    where.onayDurumu = "ONAYLANDI";
  }

  const giderler = await prisma.expense.findMany({
    where,
    orderBy: { tarih: "desc" },
    include: {
      createdBy: { select: { ad: true, soyad: true } },
      onaylayan: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(giderler);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (!["MASTER_ADMIN", "KAPICI"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = giderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const isMasterAdmin = session.user.rol === "MASTER_ADMIN";

  const gider = await prisma.expense.create({
    data: {
      aciklama: parsed.data.aciklama,
      tutar: parsed.data.tutar,
      kategori: parsed.data.kategori as never,
      tarih: new Date(parsed.data.tarih),
      fisYolu: parsed.data.fisYolu,
      fisAdi: parsed.data.fisAdi,
      onayDurumu: isMasterAdmin ? "ONAYLANDI" : "BEKLEMEDE",
      onaylayanId: isMasterAdmin ? session.user.id : null,
      buildingId: session.user.buildingId!,
      createdById: session.user.id,
    },
  });

  if (isMasterAdmin) {
    await createBuildingNotification(
      session.user.buildingId!,
      {
        baslik: "Yeni Gider Eklendi",
        mesaj: `${KATEGORI_LABELS[parsed.data.kategori]}: ${parsed.data.tutar} TL - ${parsed.data.aciklama}`,
        tip: "gider",
        link: "/giderler",
      },
      session.user.id
    );
  } else {
    const denetciler = await prisma.user.findMany({
      where: { buildingId: session.user.buildingId!, rol: "DENETCI", aktif: true },
      select: { id: true },
    });
    for (const denetci of denetciler) {
      await prisma.notification.create({
        data: {
          baslik: "Yeni Gider Onay Bekliyor",
          mesaj: `${KATEGORI_LABELS[parsed.data.kategori]}: ${parsed.data.tutar} TL - ${parsed.data.aciklama}`,
          tip: "onay",
          link: "/onay-bekleyen",
          userId: denetci.id,
        },
      });
    }
  }

  return NextResponse.json(gider, { status: 201 });
}
