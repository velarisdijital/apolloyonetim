"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Droplets,
  Zap,
  Flame,
  Plus,
  Gauge,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface SayacOkuma {
  id: string;
  deger: string;
  tarih: string;
  fotografYolu: string | null;
  not: string | null;
  okuyan: { ad: string; soyad: string };
}

interface Sayac {
  id: string;
  tip: "SU" | "ELEKTRIK" | "DOGALGAZ";
  sayacNo: string;
  konum: string | null;
  createdAt: string;
  apartmentId: string | null;
  apartment: { no: string } | null;
  okumalar: SayacOkuma[];
}

const TIP_CONFIG = {
  SU: {
    label: "Su",
    icon: Droplets,
    color: "text-blue-500",
    badgeClass:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  ELEKTRIK: {
    label: "Elektrik",
    icon: Zap,
    color: "text-yellow-500",
    badgeClass:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  DOGALGAZ: {
    label: "Dogalgaz",
    icon: Flame,
    color: "text-orange-500",
    badgeClass:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TFunc = any;

export default function SayaclarPage() {
  const { data: session } = useSession();
  const { t }: { t: TFunc } = useTranslation();
  const [sayaclar, setSayaclar] = useState<Sayac[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [okumaDialogOpen, setOkumaDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedSayac, setExpandedSayac] = useState<string | null>(null);
  const [okumaGecmisi, setOkumaGecmisi] = useState<
    Record<string, SayacOkuma[]>
  >({});
  const [gecmisLoading, setGecmisLoading] = useState<string | null>(null);

  // New meter form
  const [yeniTip, setYeniTip] = useState<string>("");
  const [yeniSayacNo, setYeniSayacNo] = useState("");
  const [yeniKonum, setYeniKonum] = useState("");
  const [yeniApartmentId, setYeniApartmentId] = useState("");

  // New reading form
  const [okumaSayacId, setOkumaSayacId] = useState("");
  const [okumaDeger, setOkumaDeger] = useState("");
  const [okumaNote, setOkumaNote] = useState("");

  const isYoneticiOrKapici =
    session?.user?.rol === "MASTER_ADMIN" || session?.user?.rol === "KAPICI";

  const fetchSayaclar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sayaclar");
      if (res.ok) {
        setSayaclar(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSayaclar();
  }, [fetchSayaclar]);

  const fetchOkumaGecmisi = async (sayacId: string) => {
    if (expandedSayac === sayacId) {
      setExpandedSayac(null);
      return;
    }
    setExpandedSayac(sayacId);
    if (okumaGecmisi[sayacId]) return;

    setGecmisLoading(sayacId);
    try {
      const res = await fetch(`/api/sayaclar/okuma?sayacId=${sayacId}`);
      if (res.ok) {
        const data = await res.json();
        setOkumaGecmisi((prev) => ({ ...prev, [sayacId]: data }));
      }
    } catch {
      // ignore
    } finally {
      setGecmisLoading(null);
    }
  };

  const handleCreateSayac = async () => {
    if (!yeniTip || !yeniSayacNo) {
      toast.error(
        t.meters?.allFieldsRequired || "Sayac tipi ve numarasi zorunludur"
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sayaclar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tip: yeniTip,
          sayacNo: yeniSayacNo,
          konum: yeniKonum || undefined,
          apartmentId: yeniApartmentId || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t.errors?.generic || "Hata olustu");
      }

      toast.success(
        t.meters?.createdSuccess || "Sayac basariyla eklendi"
      );
      setDialogOpen(false);
      setYeniTip("");
      setYeniSayacNo("");
      setYeniKonum("");
      setYeniApartmentId("");
      await fetchSayaclar();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : t.errors?.generic || "Hata olustu"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateOkuma = async () => {
    if (!okumaSayacId || !okumaDeger) {
      toast.error(t.meters?.readingRequired || "Sayac degeri zorunludur");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sayaclar/okuma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sayacId: okumaSayacId,
          deger: parseFloat(okumaDeger),
          not: okumaNote || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t.errors?.generic || "Hata olustu");
      }

      toast.success(t.meters?.readingAdded || "Okuma basariyla kaydedildi");
      setOkumaDialogOpen(false);
      const savedSayacId = okumaSayacId;
      setOkumaSayacId("");
      setOkumaDeger("");
      setOkumaNote("");
      // Refresh meter list and clear cached readings
      setOkumaGecmisi((prev) => {
        const next = { ...prev };
        delete next[savedSayacId];
        return next;
      });
      await fetchSayaclar();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : t.errors?.generic || "Hata olustu"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openOkumaDialog = (sayacId: string) => {
    setOkumaSayacId(sayacId);
    setOkumaDeger("");
    setOkumaNote("");
    setOkumaDialogOpen(true);
  };

  const formatTarih = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConsumption = (okumalar: SayacOkuma[]) => {
    if (okumalar.length < 2) return null;
    const diff = parseFloat(okumalar[0].deger) - parseFloat(okumalar[1].deger);
    return diff;
  };

  const groupedSayaclar = (["SU", "ELEKTRIK", "DOGALGAZ"] as const).map(
    (tip) => ({
      tip,
      config: TIP_CONFIG[tip],
      items: sayaclar.filter((s) => s.tip === tip),
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gauge className="h-6 w-6 text-blue-500" />
            {t.meters?.title || "Sayac Takibi"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t.meters?.subtitle ||
              "Bina sayaclarini goruntuleyin ve okuma kaydi ekleyin"}
          </p>
        </div>
        <div className="flex gap-2">
          {isYoneticiOrKapici && (
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t.meters?.addMeter || "Yeni Sayac"}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">
          {t.common?.loading || "Yukleniyor..."}
        </p>
      ) : sayaclar.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gauge className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {t.meters?.noMeters || "Henuz sayac eklenmemis"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedSayaclar.map(
            ({ tip, config, items }) =>
              items.length > 0 && (
                <div key={tip} className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <config.icon className={`h-5 w-5 ${config.color}`} />
                    {config.label}
                    <Badge variant="secondary" className="ml-1">
                      {items.length}
                    </Badge>
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((sayac) => (
                      <SayacCard
                        key={sayac.id}
                        sayac={sayac}
                        config={config}
                        expanded={expandedSayac === sayac.id}
                        onToggle={() => fetchOkumaGecmisi(sayac.id)}
                        onAddReading={() => openOkumaDialog(sayac.id)}
                        okumalar={okumaGecmisi[sayac.id]}
                        gecmisLoading={gecmisLoading === sayac.id}
                        formatTarih={formatTarih}
                        getConsumption={getConsumption}
                      />
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      )}

      {/* New Meter Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-blue-500" />
              {t.meters?.addMeterTitle || "Yeni Sayac Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.meters?.meterType || "Sayac Tipi"}</Label>
              <Select
                value={yeniTip}
                onValueChange={(v: string | null) => setYeniTip(v || "")}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t.meters?.selectType || "Tip secin"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SU">
                    <span className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" /> Su
                    </span>
                  </SelectItem>
                  <SelectItem value="ELEKTRIK">
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" /> Elektrik
                    </span>
                  </SelectItem>
                  <SelectItem value="DOGALGAZ">
                    <span className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" /> Dogalgaz
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.meters?.meterNo || "Sayac Numarasi"}</Label>
              <Input
                placeholder="orn. SU-001"
                value={yeniSayacNo}
                onChange={(e) => setYeniSayacNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.meters?.location || "Konum"}</Label>
              <Input
                placeholder="orn. Bodrum kat"
                value={yeniKonum}
                onChange={(e) => setYeniKonum(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {t.meters?.apartmentNo || "Daire No (opsiyonel)"}
              </Label>
              <Input
                placeholder="orn. Daire 5"
                value={yeniApartmentId}
                onChange={(e) => setYeniApartmentId(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreateSayac}
              disabled={submitting}
            >
              {submitting
                ? t.common?.sending || "Gonderiliyor..."
                : t.common?.submit || "Gonder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Reading Dialog */}
      <Dialog open={okumaDialogOpen} onOpenChange={setOkumaDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-500" />
              {t.meters?.addReadingTitle || "Okuma Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.meters?.readingValue || "Sayac Degeri"}</Label>
              <Input
                type="number"
                step="0.001"
                min="0"
                placeholder="orn. 1234.567"
                value={okumaDeger}
                onChange={(e) => setOkumaDeger(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.meters?.note || "Not (opsiyonel)"}</Label>
              <Input
                placeholder="orn. Aylik okuma"
                value={okumaNote}
                onChange={(e) => setOkumaNote(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreateOkuma}
              disabled={submitting}
            >
              {submitting
                ? t.common?.sending || "Gonderiliyor..."
                : t.common?.submit || "Gonder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SayacCard({
  sayac,
  config,
  expanded,
  onToggle,
  onAddReading,
  okumalar,
  gecmisLoading,
  formatTarih,
  getConsumption,
}: {
  sayac: Sayac;
  config: (typeof TIP_CONFIG)[keyof typeof TIP_CONFIG];
  expanded: boolean;
  onToggle: () => void;
  onAddReading: () => void;
  okumalar?: SayacOkuma[];
  gecmisLoading: boolean;
  formatTarih: (dateStr: string) => string;
  getConsumption: (okumalar: SayacOkuma[]) => number | null;
}) {
  const lastReading = sayac.okumalar[0];
  const consumption = getConsumption(sayac.okumalar);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <config.icon className={`h-5 w-5 ${config.color}`} />
            <CardTitle className="text-base">{sayac.sayacNo}</CardTitle>
          </div>
          <Badge className={config.badgeClass}>{config.label}</Badge>
        </div>
        {sayac.konum && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {sayac.konum}
          </p>
        )}
        {sayac.apartment && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Daire: {sayac.apartment.no}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {lastReading ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Son Okuma
              </span>
              <span className="text-lg font-semibold">
                {parseFloat(lastReading.deger).toLocaleString("tr-TR")}
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {formatTarih(lastReading.tarih)}
            </p>
            {consumption !== null && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Tuketim
                </span>
                <Badge
                  variant="secondary"
                  className={
                    consumption > 0
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : ""
                  }
                >
                  {consumption > 0 ? "+" : ""}
                  {consumption.toLocaleString("tr-TR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                  })}
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            Henuz okuma yapilmamis
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onAddReading}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Okuma Ekle
          </Button>
          <Button size="sm" variant="ghost" onClick={onToggle}>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {expanded && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            {gecmisLoading ? (
              <p className="text-sm text-gray-400 py-2">Yukleniyor...</p>
            ) : okumalar && okumalar.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Tarih</TableHead>
                      <TableHead className="text-xs text-right">
                        Deger
                      </TableHead>
                      <TableHead className="text-xs">Okuyan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {okumalar.map((okuma, idx) => {
                      const prev = okumalar[idx + 1];
                      const diff = prev
                        ? parseFloat(okuma.deger) - parseFloat(prev.deger)
                        : null;
                      return (
                        <TableRow key={okuma.id}>
                          <TableCell className="text-xs py-2">
                            {formatTarih(okuma.tarih)}
                          </TableCell>
                          <TableCell className="text-xs text-right py-2">
                            <span className="font-medium">
                              {parseFloat(okuma.deger).toLocaleString("tr-TR")}
                            </span>
                            {diff !== null && (
                              <span className="text-gray-400 ml-1">
                                (+
                                {diff.toLocaleString("tr-TR", {
                                  maximumFractionDigits: 3,
                                })}
                                )
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs py-2">
                            {okuma.okuyan.ad} {okuma.okuyan.soyad}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-2 italic">
                Okuma gecmisi bulunamadi
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
