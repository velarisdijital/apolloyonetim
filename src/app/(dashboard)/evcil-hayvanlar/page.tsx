"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  PawPrint,
  Plus,
  Cat,
  Bird,
  Fish,
  Dog,
  Trash2,
  User,
  Home,
  Syringe,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface EvcilHayvan {
  id: string;
  ad: string;
  tur: string;
  cins: string | null;
  yas: number | null;
  asiDurumu: boolean;
  asiTarihi: string | null;
  chipNo: string | null;
  not: string | null;
  createdAt: string;
  userId: string;
  user: { id: string; ad: string; soyad: string };
  apartment: { no: string } | null;
}

const TUR_OPTIONS = ["Köpek", "Kedi", "Kuş", "Balık", "Hamster", "Diğer"];

function getTurIcon(tur: string) {
  switch (tur) {
    case "Köpek":
      return Dog;
    case "Kedi":
      return Cat;
    case "Kuş":
      return Bird;
    case "Balık":
      return Fish;
    default:
      return PawPrint;
  }
}

function getTurColor(tur: string) {
  switch (tur) {
    case "Köpek":
      return "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400";
    case "Kedi":
      return "text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400";
    case "Kuş":
      return "text-sky-600 bg-sky-50 dark:bg-sky-950 dark:text-sky-400";
    case "Balık":
      return "text-cyan-600 bg-cyan-50 dark:bg-cyan-950 dark:text-cyan-400";
    case "Hamster":
      return "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400";
    default:
      return "text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400";
  }
}

export default function EvcilHayvanlarPage() {
  const { data: session } = useSession();
  const { t: _t } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = _t as any;
  const [hayvanlar, setHayvanlar] = useState<EvcilHayvan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterTur, setFilterTur] = useState<string>("all");

  // Form state
  const [ad, setAd] = useState("");
  const [tur, setTur] = useState("");
  const [cins, setCins] = useState("");
  const [yas, setYas] = useState("");
  const [asiDurumu, setAsiDurumu] = useState(false);
  const [asiTarihi, setAsiTarihi] = useState("");
  const [chipNo, setChipNo] = useState("");
  const [not_, setNot] = useState("");

  const isMasterAdmin = session?.user?.rol === "MASTER_ADMIN";

  const fetchHayvanlar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/evcil-hayvanlar");
      if (res.ok) {
        setHayvanlar(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHayvanlar();
  }, [fetchHayvanlar]);

  const resetForm = () => {
    setAd("");
    setTur("");
    setCins("");
    setYas("");
    setAsiDurumu(false);
    setAsiTarihi("");
    setChipNo("");
    setNot("");
  };

  const handleCreate = async () => {
    if (!ad || !tur) {
      toast.error(t.pets?.nameRequired || "Ad ve tür zorunludur");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/evcil-hayvanlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad,
          tur,
          cins: cins || undefined,
          yas: yas || undefined,
          asiDurumu,
          asiTarihi: asiTarihi || undefined,
          chipNo: chipNo || undefined,
          not: not_ || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error();
      }

      toast.success(t.pets?.createdSuccess || "Evcil hayvan kaydedildi");
      setDialogOpen(false);
      resetForm();
      await fetchHayvanlar();
    } catch {
      toast.error(t.errors?.generic || "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/evcil-hayvanlar?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(t.pets?.deletedSuccess || "Kayıt silindi");
        await fetchHayvanlar();
      } else {
        toast.error(t.errors?.generic || "Bir hata oluştu");
      }
    } catch {
      toast.error(t.errors?.generic || "Bir hata oluştu");
    }
  };

  const filteredHayvanlar =
    filterTur === "all"
      ? hayvanlar
      : hayvanlar.filter((h) => h.tur === filterTur);

  // Stats by type
  const stats = TUR_OPTIONS.map((t) => ({
    tur: t,
    count: hayvanlar.filter((h) => h.tur === t).length,
  })).filter((s) => s.count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PawPrint className="h-6 w-6 text-amber-500" />
            {t.pets?.title || "Evcil Hayvan Kaydı"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t.pets?.subtitle || "Binaya kayıtlı evcil hayvanları yönetin"}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t.pets?.addNew || "Hayvan Ekle"}
        </Button>
      </div>

      {/* Stats */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {stats.map((stat) => {
            const Icon = getTurIcon(stat.tur);
            const colorClass = getTurColor(stat.tur);
            return (
              <Card key={stat.tur} className="overflow-hidden">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.count}</p>
                    <p className="text-xs text-muted-foreground">{stat.tur}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium">
          {t.pets?.filterByType || "Türe göre filtrele"}:
        </Label>
        <Select value={filterTur} onValueChange={(v) => v && setFilterTur(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t.pets?.allTypes || "Tümü"}
            </SelectItem>
            {TUR_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pet Cards */}
      {loading ? (
        <p className="text-gray-500 text-sm">{t.common?.loading || "Yükleniyor..."}</p>
      ) : filteredHayvanlar.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PawPrint className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {t.pets?.noPets || "Henüz kayıtlı evcil hayvan yok"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHayvanlar.map((hayvan) => {
            const Icon = getTurIcon(hayvan.tur);
            const colorClass = getTurColor(hayvan.tur);
            const canDelete =
              hayvan.userId === session?.user?.id || isMasterAdmin;

            return (
              <Card key={hayvan.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${colorClass}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{hayvan.ad}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {hayvan.tur}
                          {hayvan.cins && ` · ${hayvan.cins}`}
                        </p>
                      </div>
                    </div>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDelete(hayvan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {hayvan.yas !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t.pets?.age || "Yaş"}
                      </span>
                      <span className="font-medium">{hayvan.yas}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Syringe className="h-3.5 w-3.5" />
                      {t.pets?.vaccination || "Aşı"}
                    </span>
                    <Badge
                      className={
                        hayvan.asiDurumu
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }
                    >
                      {hayvan.asiDurumu
                        ? t.pets?.vaccinated || "Aşılı"
                        : t.pets?.notVaccinated || "Aşısız"}
                    </Badge>
                  </div>

                  {hayvan.chipNo && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t.pets?.chipNo || "Çip No"}
                      </span>
                      <span className="font-mono text-xs">{hayvan.chipNo}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {hayvan.user.ad} {hayvan.user.soyad}
                    </span>
                    {hayvan.apartment && (
                      <span className="flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        {t.pets?.apartmentNo || "Daire"} {hayvan.apartment.no}
                      </span>
                    )}
                  </div>

                  {hayvan.not && (
                    <p className="text-xs text-muted-foreground italic pt-1">
                      {hayvan.not}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Pet Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-amber-500" />
              {t.pets?.addTitle || "Evcil Hayvan Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.pets?.name || "Ad"} *</Label>
                <Input
                  placeholder={t.pets?.namePlaceholder || "Hayvan adı"}
                  value={ad}
                  onChange={(e) => setAd(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.pets?.type || "Tür"} *</Label>
                <Select value={tur} onValueChange={(v) => v && setTur(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.pets?.selectType || "Tür seçin"} />
                  </SelectTrigger>
                  <SelectContent>
                    {TUR_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.pets?.breed || "Cins"}</Label>
                <Input
                  placeholder={t.pets?.breedPlaceholder || "Ör: Golden Retriever"}
                  value={cins}
                  onChange={(e) => setCins(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.pets?.age || "Yaş"}</Label>
                <Input
                  type="number"
                  placeholder={t.pets?.agePlaceholder || "Yaş"}
                  value={yas}
                  onChange={(e) => setYas(e.target.value)}
                  min={0}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                checked={asiDurumu}
                onCheckedChange={(checked) => setAsiDurumu(checked === true)}
              />
              <Label className="cursor-pointer">
                {t.pets?.isVaccinated || "Aşıları tam"}
              </Label>
            </div>

            {asiDurumu && (
              <div className="space-y-2">
                <Label>{t.pets?.vaccinationDate || "Son Aşı Tarihi"}</Label>
                <Input
                  type="date"
                  value={asiTarihi}
                  onChange={(e) => setAsiTarihi(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>{t.pets?.chipNo || "Çip Numarası"}</Label>
              <Input
                placeholder={t.pets?.chipNoPlaceholder || "Mikroçip numarası"}
                value={chipNo}
                onChange={(e) => setChipNo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.pets?.notes || "Not"}</Label>
              <Textarea
                placeholder={t.pets?.notesPlaceholder || "Ek bilgiler..."}
                value={not_}
                onChange={(e) => setNot(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting
                ? t.common?.sending || "Kaydediliyor..."
                : t.common?.submit || "Kaydet"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
