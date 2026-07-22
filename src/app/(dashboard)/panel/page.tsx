import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatPara } from "@/lib/format";
import { KATEGORI_LABELS } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  Wallet,
  Users,
  TrendingUp,
  ArrowRight,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Hoş geldiniz, {session.user.ad}
          </p>
        </div>
        {session.user.rol !== "EV_SAHIBI" && (
          <div className="flex gap-2">
            <Link href="/giderler/ekle">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Gider Ekle
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Bu Ay Toplam Gider
            </CardTitle>
            <Receipt className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPara(toplamTutar)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {aylikGiderler.length} kalem gider
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Ödenmemiş Aidat
            </CardTitle>
            <Wallet className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{odenmemisAidat}</div>
            <p className="text-xs text-gray-500 mt-1">daire ödeme bekliyor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Aktif Oylama
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aktifOylamalar}</div>
            <p className="text-xs text-gray-500 mt-1">devam eden oylama</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Toplam Sakin
            </CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sakinSayisi}</div>
            <p className="text-xs text-gray-500 mt-1">kayıtlı kullanıcı</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Son Giderler</CardTitle>
              <Link href="/giderler">
                <Button variant="ghost" size="sm">
                  Tümü <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {sonGiderler.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                Henüz gider kaydı yok
              </p>
            ) : (
              <div className="space-y-3">
                {sonGiderler.map((gider) => (
                  <div
                    key={gider.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 dark:border-gray-800"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {gider.aciklama}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">
                          {KATEGORI_LABELS[gider.kategori]}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {gider.createdBy.ad} {gider.createdBy.soyad}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold ml-4">
                      {formatPara(Number(gider.tutar))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Son Duyurular</CardTitle>
              <Link href="/duyurular">
                <Button variant="ghost" size="sm">
                  Tümü <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {sonDuyurular.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                Henüz duyuru yok
              </p>
            ) : (
              <div className="space-y-3">
                {sonDuyurular.map((duyuru) => (
                  <div
                    key={duyuru.id}
                    className="py-2 border-b last:border-0 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      {duyuru.onemli && (
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                      <p className="text-sm font-medium">{duyuru.baslik}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {duyuru.icerik}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
