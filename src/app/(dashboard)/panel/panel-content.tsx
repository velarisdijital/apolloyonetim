"use client";

import { useTranslation } from "@/lib/i18n/context";
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

interface Gider {
  id: string;
  aciklama: string;
  kategori: string;
  tutar: number | string;
  createdBy: { ad: string; soyad: string };
}

interface Duyuru {
  id: string;
  baslik: string;
  icerik: string;
  onemli: boolean;
}

interface PanelContentProps {
  userName: string;
  userRol: string;
  toplamTutar: number;
  giderCount: number;
  odenmemisAidat: number;
  aktifOylamalar: number;
  sakinSayisi: number;
  sonGiderler: Gider[];
  sonDuyurular: Duyuru[];
}

export function PanelContent({
  userName,
  userRol,
  toplamTutar,
  giderCount,
  odenmemisAidat,
  aktifOylamalar,
  sakinSayisi,
  sonGiderler,
  sonDuyurular,
}: PanelContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.dashboard.title}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t.auth.welcome}, {userName}
          </p>
        </div>
        {userRol !== "EV_SAHIBI" && (
          <div className="flex gap-2">
            <Link href="/giderler/ekle">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                {t.dashboard.addExpense}
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t.dashboard.monthlyExpense}
            </CardTitle>
            <Receipt className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPara(toplamTutar)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {t.dashboard.expenseCount.replace("{count}", String(giderCount))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t.dashboard.unpaidDues}
            </CardTitle>
            <Wallet className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{odenmemisAidat}</div>
            <p className="text-xs text-gray-500 mt-1">{t.dashboard.waitingPayment}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t.dashboard.activePolls}
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aktifOylamalar}</div>
            <p className="text-xs text-gray-500 mt-1">{t.dashboard.ongoingPolls}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t.dashboard.totalResidents}
            </CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sakinSayisi}</div>
            <p className="text-xs text-gray-500 mt-1">{t.dashboard.registeredUsers}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t.dashboard.recentExpenses}</CardTitle>
              <Link href="/giderler">
                <Button variant="ghost" size="sm">
                  {t.dashboard.viewAll} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {sonGiderler.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                {t.dashboard.noExpenses}
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
              <CardTitle className="text-lg">{t.dashboard.recentAnnouncements}</CardTitle>
              <Link href="/duyurular">
                <Button variant="ghost" size="sm">
                  {t.dashboard.viewAll} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {sonDuyurular.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                {t.dashboard.noAnnouncements}
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
