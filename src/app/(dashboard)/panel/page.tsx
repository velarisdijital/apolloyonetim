import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PanelContent } from "./panel-content";

export default async function PanelPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.buildingId) redirect("/giris");

  const buildingId = session.user.buildingId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    aylikGiderler,
    toplamGider,
    odenmemisAidat,
    sakinSayisi,
    sonGiderler,
    aktifOylamalar,
    sonDuyurular,
  ] = await Promise.all([
    prisma.expense.findMany({
      where: {
        buildingId,
        tarih: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    prisma.expense.aggregate({
      where: {
        buildingId,
        tarih: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { tutar: true },
    }),
    prisma.duesItem.count({
      where: {
        dues: { buildingId },
        durum: { in: ["ODENMEDI", "GECIKTI"] },
      },
    }),
    prisma.user.count({
      where: { buildingId, aktif: true },
    }),
    prisma.expense.findMany({
      where: { buildingId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { createdBy: { select: { ad: true, soyad: true } } },
    }),
    prisma.poll.count({
      where: { buildingId, durum: "AKTIF" },
    }),
    prisma.announcement.findMany({
      where: { buildingId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const toplamTutar = toplamGider._sum.tutar
    ? Number(toplamGider._sum.tutar)
    : 0;

  return (
    <PanelContent
      userName={session.user.ad}
      userRol={session.user.rol}
      toplamTutar={toplamTutar}
      giderCount={aylikGiderler.length}
      odenmemisAidat={odenmemisAidat}
      aktifOylamalar={aktifOylamalar}
      sakinSayisi={sakinSayisi}
      sonGiderler={sonGiderler.map((g) => ({
        id: g.id,
        aciklama: g.aciklama,
        kategori: g.kategori,
        tutar: Number(g.tutar),
        createdBy: g.createdBy,
      }))}
      sonDuyurular={sonDuyurular.map((d) => ({
        id: d.id,
        baslik: d.baslik,
        icerik: d.icerik,
        onemli: d.onemli,
      }))}
    />
  );
}
