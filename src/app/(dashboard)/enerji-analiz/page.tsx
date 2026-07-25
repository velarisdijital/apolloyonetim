"use client";

import { useState, useEffect, useCallback } from "react";
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
  Zap,
  Droplets,
  Flame,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MonthlyData {
  ay: number;
  ayAdi: string;
  tuketim: number;
}

interface TipOzet {
  tip: string;
  aylik: MonthlyData[];
  toplam: number;
  ortalama: number;
  enYuksekAy: string;
  enYuksekDeger: number;
  enDusukAy: string;
  enDusukDeger: number;
}

interface DaireData {
  daireNo: string;
  daireId: string;
  tip: string;
  aylik: MonthlyData[];
  toplam: number;
}

interface AnalysisData {
  yil: number;
  tipOzet: TipOzet[];
  daireler: DaireData[];
  yillikDegisim: Record<string, number | null>;
  mevcutYillar: number[];
}

const TIP_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; unit: string }> = {
  ELEKTRIK: {
    label: "Elektrik",
    color: "#eab308",
    icon: <Zap className="h-4 w-4" />,
    unit: "kWh",
  },
  SU: {
    label: "Su",
    color: "#3b82f6",
    icon: <Droplets className="h-4 w-4" />,
    unit: "m³",
  },
  DOGALGAZ: {
    label: "Dogalgaz",
    color: "#f97316",
    icon: <Flame className="h-4 w-4" />,
    unit: "m³",
  },
};

const TIP_OPTIONS = [
  { value: "all", label: "Tum Tipler" },
  { value: "ELEKTRIK", label: "Elektrik" },
  { value: "SU", label: "Su" },
  { value: "DOGALGAZ", label: "Dogalgaz" },
];

export default function EnerjiAnalizPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTip, setFilterTip] = useState("all");
  const [filterYil, setFilterYil] = useState(new Date().getFullYear().toString());

  const userRole = (session?.user as { rol?: string })?.rol;
  const canView = userRole === "MASTER_ADMIN" || userRole === "DENETCI";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTip !== "all") params.set("tip", filterTip);
      params.set("yil", filterYil);
      const queryStr = params.toString();
      const res = await fetch(`/api/enerji-analiz${queryStr ? `?${queryStr}` : ""}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        const err = await res.json();
        toast.error(err.error || "Veri yuklenirken hata olustu");
      }
    } catch {
      toast.error("Veri yuklenirken hata olustu");
    } finally {
      setLoading(false);
    }
  }, [filterTip, filterYil]);

  useEffect(() => {
    if (canView) fetchData();
  }, [fetchData, canView]);

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Bu sayfayi goruntuleme yetkiniz yok</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{t.common.loading}</p>
      </div>
    );
  }

  if (!data || data.tipOzet.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enerji Tuketim Analizi</h1>
          <p className="text-muted-foreground">Sayac verilerine dayali tuketim analizi</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Henuz yeterli sayac okuma verisi yok
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build chart data: merge all tips into one dataset per month
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const row: Record<string, string | number> = {
      ay: data.tipOzet[0]?.aylik[i]?.ayAdi || "",
    };
    for (const tipOzet of data.tipOzet) {
      const cfg = TIP_CONFIG[tipOzet.tip];
      row[cfg?.label || tipOzet.tip] = tipOzet.aylik[i]?.tuketim || 0;
    }
    return row;
  });

  // Build per-apartment comparison data (group by tip)
  const daireByTip = new Map<string, DaireData[]>();
  for (const d of data.daireler) {
    if (!daireByTip.has(d.tip)) daireByTip.set(d.tip, []);
    daireByTip.get(d.tip)!.push(d);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enerji Tuketim Analizi</h1>
          <p className="text-muted-foreground">Sayac verilerine dayali tuketim analizi</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={filterTip} onValueChange={(v) => setFilterTip(v || "")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sayac Tipi" />
          </SelectTrigger>
          <SelectContent>
            {TIP_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterYil} onValueChange={(v) => setFilterYil(v || "")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Yil" />
          </SelectTrigger>
          <SelectContent>
            {data.mevcutYillar.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards per Tip */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.tipOzet.map((tipOzet) => {
          const cfg = TIP_CONFIG[tipOzet.tip] || {
            label: tipOzet.tip,
            color: "#6b7280",
            icon: <BarChart3 className="h-4 w-4" />,
            unit: "",
          };
          const degisim = data.yillikDegisim[tipOzet.tip];

          return (
            <Card key={tipOzet.tip}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{cfg.label}</CardTitle>
                <span style={{ color: cfg.color }}>{cfg.icon}</span>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-2xl font-bold">
                    {tipOzet.toplam.toLocaleString("tr-TR")} {cfg.unit}
                  </div>
                  <p className="text-xs text-muted-foreground">Toplam yillik tuketim</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Aylik Ortalama</p>
                    <p className="font-medium">
                      {tipOzet.ortalama.toLocaleString("tr-TR")} {cfg.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Yillik Degisim</p>
                    {degisim !== null && degisim !== undefined ? (
                      <p className={`font-medium flex items-center gap-1 ${degisim > 0 ? "text-red-500" : "text-green-500"}`}>
                        {degisim > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        %{Math.abs(degisim)}
                      </p>
                    ) : (
                      <p className="font-medium text-muted-foreground">--</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">En Yuksek</p>
                    <p className="font-medium">
                      {tipOzet.enYuksekAy} ({tipOzet.enYuksekDeger.toLocaleString("tr-TR")})
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">En Dusuk</p>
                    <p className="font-medium">
                      {tipOzet.enDusukAy} ({tipOzet.enDusukDeger.toLocaleString("tr-TR")})
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Line Chart - Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Aylik Tuketim Trendi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ay" />
                <YAxis />
                <Tooltip />
                <Legend />
                {data.tipOzet.map((tipOzet) => {
                  const cfg = TIP_CONFIG[tipOzet.tip];
                  return (
                    <Line
                      key={tipOzet.tip}
                      type="monotone"
                      dataKey={cfg?.label || tipOzet.tip}
                      stroke={cfg?.color || "#6b7280"}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart - Monthly Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Aylik Tuketim Karsilastirmasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ay" />
                <YAxis />
                <Tooltip />
                <Legend />
                {data.tipOzet.map((tipOzet) => {
                  const cfg = TIP_CONFIG[tipOzet.tip];
                  return (
                    <Bar
                      key={tipOzet.tip}
                      dataKey={cfg?.label || tipOzet.tip}
                      fill={cfg?.color || "#6b7280"}
                      radius={[4, 4, 0, 0]}
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Per-Apartment Comparison */}
      {data.daireler.length > 1 && (
        <>
          {Array.from(daireByTip.entries()).map(([tip, daireler]) => {
            if (daireler.length <= 1) return null;
            const cfg = TIP_CONFIG[tip] || {
              label: tip,
              color: "#6b7280",
              icon: <BarChart3 className="h-4 w-4" />,
              unit: "",
            };

            // Build comparison chart data
            const compData = Array.from({ length: 12 }, (_, i) => {
              const row: Record<string, string | number> = {
                ay: daireler[0]?.aylik[i]?.ayAdi || "",
              };
              for (const d of daireler) {
                row[`Daire ${d.daireNo}`] = d.aylik[i]?.tuketim || 0;
              }
              return row;
            });

            const COLORS = [
              "#3b82f6", "#ef4444", "#22c55e", "#a855f7",
              "#f97316", "#06b6d4", "#ec4899", "#84cc16",
            ];

            return (
              <Card key={tip}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span style={{ color: cfg.color }}>{cfg.icon}</span>
                    {cfg.label} - Daire Karsilastirmasi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={compData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ay" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {daireler.map((d, idx) => (
                          <Bar
                            key={d.daireId}
                            dataKey={`Daire ${d.daireNo}`}
                            fill={COLORS[idx % COLORS.length]}
                            radius={[2, 2, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
