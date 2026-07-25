"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Wrench,
  Zap,
  Paintbrush,
  Sparkles,
  Key,
  Truck,
  TreePine,
  ArrowUpDown,
  Plus,
  Phone,
  MapPin,
  User,
  Search,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface HizmetSaglayici {
  id: string;
  ad: string;
  kategori: string;
  telefon: string;
  adres: string | null;
  aciklama: string | null;
  puan: number | null;
  aktif: boolean;
  createdAt: string;
  ekleyen: { ad: string; soyad: string };
}

type Kategori =
  | "TESISATCI"
  | "ELEKTRIKCI"
  | "BOYACI"
  | "TEMIZLIK"
  | "CILINGIR"
  | "NAKLIYE"
  | "BAHCE"
  | "ASANSOR"
  | "DIGER";

const KATEGORI_CONFIG: Record<
  Kategori,
  { label: string; icon: typeof Wrench; color: string }
> = {
  TESISATCI: {
    label: "Tesisatci",
    icon: Wrench,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  ELEKTRIKCI: {
    label: "Elektrikci",
    icon: Zap,
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  BOYACI: {
    label: "Boyaci",
    icon: Paintbrush,
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  TEMIZLIK: {
    label: "Temizlik",
    icon: Sparkles,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  CILINGIR: {
    label: "Cilingir",
    icon: Key,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
  NAKLIYE: {
    label: "Nakliye",
    icon: Truck,
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  BAHCE: {
    label: "Bahce",
    icon: TreePine,
    color:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  },
  ASANSOR: {
    label: "Asansor",
    icon: ArrowUpDown,
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  },
  DIGER: {
    label: "Diger",
    icon: MoreHorizontal,
    color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  },
};

const KATEGORI_OPTIONS: { value: Kategori; label: string }[] = [
  { value: "TESISATCI", label: "Tesisatci" },
  { value: "ELEKTRIKCI", label: "Elektrikci" },
  { value: "BOYACI", label: "Boyaci" },
  { value: "TEMIZLIK", label: "Temizlik" },
  { value: "CILINGIR", label: "Cilingir" },
  { value: "NAKLIYE", label: "Nakliye" },
  { value: "BAHCE", label: "Bahce" },
  { value: "ASANSOR", label: "Asansor" },
  { value: "DIGER", label: "Diger" },
];

export default function HizmetRehberiPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [hizmetler, setHizmetler] = useState<HizmetSaglayici[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKategori, setSelectedKategori] = useState<string>("ALL");

  // Form state
  const [ad, setAd] = useState("");
  const [kategori, setKategori] = useState<string>("");
  const [telefon, setTelefon] = useState("");
  const [adres, setAdres] = useState("");
  const [aciklama, setAciklama] = useState("");

  const isMasterAdmin = session?.user?.rol === "MASTER_ADMIN";
  const isYoneticiOrKapici =
    session?.user?.rol === "MASTER_ADMIN" || session?.user?.rol === "KAPICI";

  const fetchHizmetler = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedKategori && selectedKategori !== "ALL") {
        params.set("kategori", selectedKategori);
      }
      const res = await fetch(`/api/hizmet-rehberi?${params.toString()}`);
      if (res.ok) {
        setHizmetler(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedKategori]);

  useEffect(() => {
    fetchHizmetler();
  }, [fetchHizmetler]);

  const filteredHizmetler = hizmetler.filter((h) =>
    h.ad.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!ad || !kategori || !telefon) {
      toast.error(
        t.services
          ?.allFieldsRequired || "Ad, kategori ve telefon zorunludur"
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/hizmet-rehberi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad, kategori, telefon, adres, aciklama }),
      });

      if (!res.ok) {
        throw new Error();
      }

      toast.success(
        t.services
          ?.createdSuccess || "Hizmet saglayici eklendi"
      );
      setDialogOpen(false);
      setAd("");
      setKategori("");
      setTelefon("");
      setAdres("");
      setAciklama("");
      await fetchHizmetler();
    } catch {
      toast.error(t.errors?.generic || "Bir hata olustu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.services?.deleteConfirm || "Bu hizmet saglayiciyi silmek istediginize emin misiniz?")) {
      return;
    }

    try {
      const res = await fetch(`/api/hizmet-rehberi?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(
          t.services
            ?.deletedSuccess || "Hizmet saglayici silindi"
        );
        await fetchHizmetler();
      } else {
        throw new Error();
      }
    } catch {
      toast.error(t.errors?.generic || "Bir hata olustu");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-6 w-6 text-blue-500" />
            {t.services?.title ||
              "Hizmet Saglayici Rehberi"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t.services
              ?.subtitle ||
              "Apartman icin hizmet saglayici bilgileri"}
          </p>
        </div>
        {isYoneticiOrKapici && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t.services?.addNew ||
              "Hizmet Saglayici Ekle"}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={
              t.services
                ?.searchPlaceholder || "Hizmet saglayici ara..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedKategori} onValueChange={(v) => setSelectedKategori(v || "")}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue
              placeholder={
                t.services
                  ?.allCategories || "Tum Kategoriler"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              {t.services
                ?.allCategories || "Tum Kategoriler"}
            </SelectItem>
            {KATEGORI_OPTIONS.map((k) => (
              <SelectItem key={k.value} value={k.value}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-gray-500 text-sm">
          {t.common?.loading || "Yukleniyor..."}
        </p>
      ) : filteredHizmetler.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {t.services
                ?.noProviders || "Henuz hizmet saglayici eklenmemis"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHizmetler.map((hizmet) => {
            const config =
              KATEGORI_CONFIG[hizmet.kategori as Kategori] ||
              KATEGORI_CONFIG.DIGER;
            const Icon = config.icon;

            return (
              <Card key={hizmet.id} className="relative">
                {isMasterAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-3 right-3 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => handleDelete(hizmet.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-2">
                      <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate pr-8">
                        {hizmet.ad}
                      </CardTitle>
                      <Badge className={`mt-1 ${config.color}`}>
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Phone */}
                  <a
                    href={`tel:${hizmet.telefon}`}
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {hizmet.telefon}
                  </a>

                  {/* Address */}
                  {hizmet.adres && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{hizmet.adres}</span>
                    </div>
                  )}

                  {/* Description */}
                  {hizmet.aciklama && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {hizmet.aciklama}
                    </p>
                  )}

                  {/* Added by */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <User className="h-3.5 w-3.5" />
                    <span>
                      {t.services
                        ?.addedBy || "Ekleyen"}
                      : {hizmet.ekleyen.ad} {hizmet.ekleyen.soyad}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-500" />
              {t.services
                ?.addTitle || "Hizmet Saglayici Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {t.services
                  ?.providerName || "Ad / Firma Adi"}{" "}
                *
              </Label>
              <Input
                placeholder={
                  t.services
                    ?.providerNamePlaceholder || "Ornek: Ahmet Usta"
                }
                value={ad}
                onChange={(e) => setAd(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {t.services
                  ?.category || "Kategori"}{" "}
                *
              </Label>
              <Select value={kategori} onValueChange={(v) => setKategori(v || "")}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      t.services
                        ?.selectCategory || "Kategori secin"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORI_OPTIONS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {t.services
                  ?.phone || "Telefon"}{" "}
                *
              </Label>
              <Input
                placeholder={
                  t.services
                    ?.phonePlaceholder || "0555 123 45 67"
                }
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <Label>
                {t.services
                  ?.address || "Adres"}
              </Label>
              <Input
                placeholder={
                  t.services
                    ?.addressPlaceholder || "Adres (istege bagli)"
                }
                value={adres}
                onChange={(e) => setAdres(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {t.services
                  ?.description || "Aciklama"}
              </Label>
              <Textarea
                placeholder={
                  t.services
                    ?.descriptionPlaceholder ||
                  "Hizmet saglayici hakkinda notlar (istege bagli)"
                }
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting
                ? t.common?.sending || "Gonderiliyor..."
                : t.services
                    ?.save || "Kaydet"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
