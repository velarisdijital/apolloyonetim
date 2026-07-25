import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBuildingNotification, createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.buildingId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Sadece yönetici karar verebilir" }, { status: 403 });
  }

  const body = await req.json();
  const { ihlalId, karar, cezaTutar, yoneticiNotu, duvardaPaylas } = body;

  if (!ihlalId || !["UYARI_VERILDI", "CEZA_VERILDI", "IPTAL"].includes(karar)) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (karar === "CEZA_VERILDI" && !cezaTutar) {
    return NextResponse.json({ error: "Ceza tutarı gerekli" }, { status: 400 });
  }

  const ihlal = await prisma.ihlal.findUnique({
    where: { id: ihlalId },
    include: {
      apartment: { select: { no: true, residents: { select: { id: true } } } },
      kural: { select: { siraNo: true, eylem: true } },
    },
  });

  if (!ihlal) {
    return NextResponse.json({ error: "İhlal bulunamadı" }, { status: 404 });
  }

  const updated = await prisma.ihlal.update({
    where: { id: ihlalId },
    data: {
      durum: karar,
      cezaTutar: karar === "CEZA_VERILDI" ? cezaTutar : null,
      yoneticiNotu,
      duvardaPaylas: duvardaPaylas || false,
      onaylayanId: session.user.id,
    },
  });

  for (const resident of ihlal.apartment.residents) {
    const baslik = karar === "UYARI_VERILDI"
      ? "Uyarı Aldınız"
      : karar === "CEZA_VERILDI"
        ? "Ceza Verildi"
        : "İhlal İptal Edildi";

    const mesaj = karar === "UYARI_VERILDI"
      ? `Daireniz için uyarı verildi: ${ihlal.kural.eylem.substring(0, 80)}...`
      : karar === "CEZA_VERILDI"
        ? `Dairenize ${cezaTutar} TL ceza kesildi: ${ihlal.kural.eylem.substring(0, 80)}...`
        : `Dairenize ait ihlal iptal edildi.`;

    await createNotification(resident.id, {
      baslik,
      mesaj,
      tip: "ceza",
      link: "/cezalar",
    });
  }

  if (duvardaPaylas && karar !== "IPTAL") {
    const duyuruMesaj = karar === "UYARI_VERILDI"
      ? `Daire ${ihlal.apartment.no}'ye uyarı verildi.\n\nKural: ${ihlal.kural.eylem}\n\nLütfen kurallara uyulması hususunda dikkatli olunuz.`
      : `Daire ${ihlal.apartment.no}'ye ${cezaTutar} TL ceza kesildi.\n\nKural: ${ihlal.kural.eylem}\n\nTüm sakinlerimizin kurallara uyması önemle rica olunur.`;

    await prisma.announcement.create({
      data: {
        baslik: karar === "UYARI_VERILDI" ? "Kural İhlali Uyarısı" : "Ceza Bildirimi",
        icerik: duyuruMesaj,
        onemli: karar === "CEZA_VERILDI",
        buildingId: session.user.buildingId,
        createdById: session.user.id,
      },
    });

    await createBuildingNotification(
      session.user.buildingId,
      {
        baslik: karar === "UYARI_VERILDI" ? "Kural İhlali Uyarısı" : "Ceza Bildirimi",
        mesaj: duyuruMesaj.substring(0, 150),
        tip: "duyuru",
        link: "/duyurular",
      },
      session.user.id
    );
  }

  return NextResponse.json(updated);
}
