"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, TrendingUp, TrendingDown, Wallet, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPara } from "@/lib/format";
import { KATEGORI_LABELS } from "@/lib/constants";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AYLAR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const RENK_PALETI = [
  "#2563eb", "#22c55e", "#f97316", "#a855f7", "#ef4444",
  "#14b8a6", "#ec4899", "#eab308", "#6366f1", "#6b7280",
];

interface RaporData {
  giderlerByKategori: { kategori: string; toplam: number }[];
  trendVerisi: { ay: string; toplam: number }[];
  aidatOzet: {
    toplamDaire: number;
    odpisMis: number;
    kismiOdemis: number;
    odenmemis: number;
    toplamTahsilat: number;
    toplamBeklenen: number;
  };
}

export default function RaporlarPage() {
  const now = new Date();
  const [ay, setAy] = useState(String(now.getMonth() + 1));
  const [yil, setYil] = useState(String(now.getFullYear()));
  const [data, setData] = useState<RaporData | null>(null);
  const [loading, setLoading] = useState(true);

  const yillar = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/raporlar?ay=${ay}&yil=${yil}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Rapor verileri yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ay, yil]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [["Kategori", "Tutar (TL)"]];
    data.giderlerByKategori.forEach((g) => {
      rows.push([KATEGORI_LABELS[g.kategori as keyof typeof KATEGORI_LABELS] || g.kategori, String(g.toplam)]);
    });
    rows.push([]);
    rows.push(["Aidat Özet", ""]);
    rows.push(["Toplam Daire", String(data.aidatOzet.toplamDaire)]);
    rows.push(["Ödemiş", String(data.aidatOzet.odpisMis)]);
    rows.push(["Ödenmemiş", String(data.aidatOzet.odenmemis)]);
    rows.push(["Toplam Tahsilat", String(data.aidatOzet.toplamTahsilat)]);
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapor_${AYLAR[Number(ay) - 1]}_${yil}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toplamGider = data?.giderlerByKategori?.reduce((s, g) => s + g.toplam, 0) || 0;
  const toplamTahsilat = data?.aidatOzet?.toplamTahsilat || 0;
  const bakiye = toplamTahsilat - toplamGider;

  const pieData = (data?.giderlerByKategori || []).map((item) => ({
    name: KATEGORI_LABELS[item.kategori as keyof typeof KATEGORI_LABELS] || item.kategori,
    value: item.toplam,
  }));

  const trendData = (data?.trendVerisi || []).map((item) => ({
    ay: item.ay,
    gider: item.toplam,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Raporlar</h1>
        <p className="text-gray-500 dark:text-gray-400">Aylık gelir-gider raporları</p>
      </div>

      <div className="flex items-center gap-4">
        <Select value={ay} onValueChange={(v) => v && setAy(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Ay seçin" />
          </SelectTrigger>
          <SelectContent>
            {AYLAR.map((ayAdi, index) => (
              <SelectItem key={index + 1} value={String(index + 1)}>
                {ayAdi}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={exportCSV} disabled={!data}>
          <Download className="h-4 w-4 mr-1" />
          CSV
        </Button>

        <Select value={yil} onValueChange={(v) => v && setYil(v)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Yıl seçin" />
          </SelectTrigger>
          <SelectContent>
            {yillar.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Yükleniyor...</div>
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Rapor verisi bulunamadı.</div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Aidat Tahsilatı</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatPara(toplamTahsilat)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {data.aidatOzet.odpisMis}/{data.aidatOzet.toplamDaire} daire ödedi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Toplam Gider</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatPara(toplamGider)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {data.giderlerByKategori.length} farklı kategori
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Bakiye</CardTitle>
                <Wallet className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${bakiye >= 0 ? "text-blue-600" : "text-red-600"}`}>
                  {formatPara(bakiye)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  Gider Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: { name?: string; percent?: number }) =>
                          `${props.name || ""} (${((props.percent || 0) * 100).toFixed(0)}%)`
                        }
                        outerRadius={100}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={RENK_PALETI[index % RENK_PALETI.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatPara(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    Bu dönemde gider verisi bulunamadı.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  Aylık Gider Trendi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ay" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip formatter={(value) => formatPara(Number(value))} />
                      <Line
                        type="monotone"
                        dataKey="gider"
                        name="Gider"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    Trend verisi bulunamadı.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
