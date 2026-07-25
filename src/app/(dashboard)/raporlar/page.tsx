"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  Download,
  FileText,
  Plus,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPara } from "@/lib/format";
import { KATEGORI_LABELS } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const RENK_PALETI = [
  "#2563eb", "#22c55e", "#f97316", "#a855f7", "#ef4444",
  "#14b8a6", "#ec4899", "#eab308", "#6366f1", "#6b7280",
];

const KATEGORILER = Object.keys(KATEGORI_LABELS);

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

interface ButceItem {
  id: string;
  yil: number;
  ay: number;
  kategori: string;
  planlanan: number;
}

export default function RaporlarPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const now = new Date();
  const [ay, setAy] = useState(String(now.getMonth() + 1));
  const [yil, setYil] = useState(String(now.getFullYear()));
  const [data, setData] = useState<RaporData | null>(null);
  const [loading, setLoading] = useState(true);
  const [butceler, setButceler] = useState<ButceItem[]>([]);
  const [showButceDialog, setShowButceDialog] = useState(false);
  const [butceKategori, setButceKategori] = useState("");
  const [butceTutar, setButceTutar] = useState("");
  const [activeTab, setActiveTab] = useState<"rapor" | "butce">("rapor");

  const yillar = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];
  const isMasterAdmin = session?.user?.rol === "MASTER_ADMIN";

  const fetchButce = useCallback(async () => {
    try {
      const res = await fetch(`/api/butce?yil=${yil}`);
      if (res.ok) setButceler(await res.json());
    } catch { /* ignore */ }
  }, [yil]);

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
    fetchButce();
  }, [ay, yil, fetchButce]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [[t.common.category, `${t.common.amount} (TL)`]];
    data.giderlerByKategori.forEach((g) => {
      rows.push([KATEGORI_LABELS[g.kategori as keyof typeof KATEGORI_LABELS] || g.kategori, String(g.toplam)]);
    });
    rows.push([]);
    rows.push([t.reports.duesCollection, ""]);
    rows.push([t.common.total + " " + t.residents.apartment, String(data.aidatOzet.toplamDaire)]);
    rows.push([t.dues.paid, String(data.aidatOzet.odpisMis)]);
    rows.push([t.dues.unpaid, String(data.aidatOzet.odenmemis)]);
    rows.push([t.reports.duesCollection, String(data.aidatOzet.toplamTahsilat)]);
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapor_${t.months[Number(ay) as keyof typeof t.months]}_${yil}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    if (!data) return;
    const jsPDFModule = await import("jspdf");
    const jsPDF = jsPDFModule.default;
    const autoTableModule = await import("jspdf-autotable");
    const autoTable = autoTableModule.default;

    const doc = new jsPDF();
    const ayAdi = t.months[Number(ay) as keyof typeof t.months];

    doc.setFontSize(18);
    doc.text("Apollo - Aylik Rapor", 14, 22);
    doc.setFontSize(12);
    doc.text(`${ayAdi} ${yil}`, 14, 32);

    doc.setFontSize(14);
    doc.text("Ozet", 14, 46);
    doc.setFontSize(11);
    doc.text(`Toplam Tahsilat: ${formatPara(toplamTahsilat)}`, 14, 55);
    doc.text(`Toplam Gider: ${formatPara(toplamGider)}`, 14, 63);
    doc.text(`Bakiye: ${formatPara(bakiye)}`, 14, 71);

    doc.setFontSize(14);
    doc.text("Gider Dagilimi", 14, 87);

    const giderRows = data.giderlerByKategori.map((g) => [
      KATEGORI_LABELS[g.kategori as keyof typeof KATEGORI_LABELS] || g.kategori,
      formatPara(g.toplam),
    ]);
    giderRows.push(["TOPLAM", formatPara(toplamGider)]);

    autoTable(doc, {
      startY: 92,
      head: [["Kategori", "Tutar (TL)"]],
      body: giderRows,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 10 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const afterTable = (doc as any).lastAutoTable?.finalY || 130;

    doc.setFontSize(14);
    doc.text("Aidat Durumu", 14, afterTable + 15);

    autoTable(doc, {
      startY: afterTable + 20,
      head: [["Durum", "Sayi"]],
      body: [
        ["Toplam Daire", String(data.aidatOzet.toplamDaire)],
        ["Odemis", String(data.aidatOzet.odpisMis)],
        ["Kismi Odemis", String(data.aidatOzet.kismiOdemis)],
        ["Odenmemis", String(data.aidatOzet.odenmemis)],
        ["Tahsilat", formatPara(data.aidatOzet.toplamTahsilat)],
        ["Beklenen", formatPara(data.aidatOzet.toplamBeklenen)],
      ],
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 10 },
    });

    if (butceler.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const afterAidat = (doc as any).lastAutoTable?.finalY || 200;
      const ayButce = butceler.filter((b) => b.ay === Number(ay));
      if (ayButce.length > 0) {
        doc.setFontSize(14);
        doc.text("Butce Karsilastirmasi", 14, afterAidat + 15);
        const butceRows = ayButce.map((b) => {
          const gerceklesen = data.giderlerByKategori.find((g) => g.kategori === b.kategori)?.toplam || 0;
          const fark = Number(b.planlanan) - gerceklesen;
          return [
            KATEGORI_LABELS[b.kategori as keyof typeof KATEGORI_LABELS] || b.kategori,
            formatPara(Number(b.planlanan)),
            formatPara(gerceklesen),
            formatPara(fark),
          ];
        });
        autoTable(doc, {
          startY: afterAidat + 20,
          head: [["Kategori", "Planlanan", "Gerceklesen", "Fark"]],
          body: butceRows,
          theme: "grid",
          headStyles: { fillColor: [168, 85, 247] },
          styles: { fontSize: 10 },
        });
      }
    }

    doc.save(`rapor_${ayAdi}_${yil}.pdf`);
    toast.success("PDF raporu indirildi");
  };

  const handleButceKaydet = async () => {
    if (!butceKategori || !butceTutar) return;
    try {
      const res = await fetch("/api/butce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yil: Number(yil),
          ay: Number(ay),
          kategori: butceKategori,
          planlanan: Number(butceTutar),
        }),
      });
      if (res.ok) {
        toast.success("Bütçe kaydedildi");
        setShowButceDialog(false);
        setButceKategori("");
        setButceTutar("");
        fetchButce();
      } else {
        toast.error("Bütçe kaydedilemedi");
      }
    } catch {
      toast.error("Hata oluştu");
    }
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

  const ayButceleri = butceler.filter((b) => b.ay === Number(ay));
  const butceKarsilastirma = ayButceleri.map((b) => {
    const gerceklesen = data?.giderlerByKategori.find((g) => g.kategori === b.kategori)?.toplam || 0;
    return {
      kategori: KATEGORI_LABELS[b.kategori as keyof typeof KATEGORI_LABELS] || b.kategori,
      planlanan: Number(b.planlanan),
      gerceklesen,
    };
  });

  const toplamPlanlanan = ayButceleri.reduce((s, b) => s + Number(b.planlanan), 0);
  const butceFarki = toplamPlanlanan - toplamGider;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.reports.title}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t.reports.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={ay} onValueChange={(v) => setAy(v || "")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <SelectItem key={m} value={String(m)}>
                {t.months[m as keyof typeof t.months]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={yil} onValueChange={(v) => setYil(v || "")}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yillar.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!data}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={!data}>
            <FileText className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === "rapor" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("rapor")}
        >
          <BarChart3 className="h-4 w-4 mr-1" />
          Raporlar
        </Button>
        <Button
          variant={activeTab === "butce" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("butce")}
        >
          <Target className="h-4 w-4 mr-1" />
          Bütçe Planlama
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">{t.common.loading}</div>
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">{t.reports.noReportData}</div>
        </div>
      ) : activeTab === "rapor" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{t.reports.duesCollection}</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatPara(toplamTahsilat)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {t.reports.apartmentsPaid.replace("{paid}", String(data.aidatOzet.odpisMis)).replace("{total}", String(data.aidatOzet.toplamDaire))}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{t.reports.totalExpense}</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatPara(toplamGider)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {t.reports.differentCategories.replace("{count}", String(data.giderlerByKategori.length))}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{t.reports.balance}</CardTitle>
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
                  {t.reports.expenseDistribution}
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
                    {t.reports.noExpenseData}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  {t.reports.monthlyTrend}
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
                        name={t.expenses.title}
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    {t.reports.noTrendData}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        /* Bütçe Planlama Tab */
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Planlanan Bütçe</CardTitle>
                <Target className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{formatPara(toplamPlanlanan)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {ayButceleri.length} kategori planlanmış
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Gerçekleşen Gider</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatPara(toplamGider)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Bütçe Farkı</CardTitle>
                <Wallet className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${butceFarki >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatPara(butceFarki)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {butceFarki >= 0 ? "Bütçe altında" : "Bütçe aşımı"}
                </p>
              </CardContent>
            </Card>
          </div>

          {isMasterAdmin && (
            <div className="flex justify-end">
              <Button onClick={() => setShowButceDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Bütçe Ekle
              </Button>
            </div>
          )}

          {butceKarsilastirma.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  Bütçe vs Gerçekleşen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={butceKarsilastirma}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="kategori" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip formatter={(value) => formatPara(Number(value))} />
                    <Legend />
                    <Bar dataKey="planlanan" name="Planlanan" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gerceklesen" name="Gerçekleşen" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Bu ay için bütçe planı yok</p>
                  <p className="text-sm mt-1">Bütçe ekleyerek harcamalarınızı planlayın</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Kategori bazlı bütçe tablosu */}
          {ayButceleri.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kategori Detayları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Kategori</th>
                        <th className="text-right py-2 px-3">Planlanan</th>
                        <th className="text-right py-2 px-3">Gerçekleşen</th>
                        <th className="text-right py-2 px-3">Fark</th>
                        <th className="text-right py-2 px-3">Kullanım</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ayButceleri.map((b) => {
                        const gerceklesen = data?.giderlerByKategori.find((g) => g.kategori === b.kategori)?.toplam || 0;
                        const fark = Number(b.planlanan) - gerceklesen;
                        const yuzde = Number(b.planlanan) > 0 ? (gerceklesen / Number(b.planlanan)) * 100 : 0;
                        return (
                          <tr key={b.id} className="border-b">
                            <td className="py-2 px-3 font-medium">
                              {KATEGORI_LABELS[b.kategori as keyof typeof KATEGORI_LABELS] || b.kategori}
                            </td>
                            <td className="text-right py-2 px-3">{formatPara(Number(b.planlanan))}</td>
                            <td className="text-right py-2 px-3">{formatPara(gerceklesen)}</td>
                            <td className={`text-right py-2 px-3 font-medium ${fark >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatPara(fark)}
                            </td>
                            <td className="text-right py-2 px-3">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${yuzde > 100 ? "bg-red-500" : yuzde > 80 ? "bg-yellow-500" : "bg-green-500"}`}
                                    style={{ width: `${Math.min(yuzde, 100)}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-medium ${yuzde > 100 ? "text-red-600" : ""}`}>
                                  %{yuzde.toFixed(0)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Bütçe Ekleme Dialog */}
      <Dialog open={showButceDialog} onOpenChange={setShowButceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bütçe Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Dönem</Label>
              <p className="text-sm text-gray-500">
                {t.months[Number(ay) as keyof typeof t.months]} {yil}
              </p>
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={butceKategori} onValueChange={(v) => setButceKategori(v || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORILER.map((k) => (
                    <SelectItem key={k} value={k}>
                      {KATEGORI_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Planlanan Tutar (TL)</Label>
              <Input
                type="number"
                value={butceTutar}
                onChange={(e) => setButceTutar(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowButceDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleButceKaydet} disabled={!butceKategori || !butceTutar}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
