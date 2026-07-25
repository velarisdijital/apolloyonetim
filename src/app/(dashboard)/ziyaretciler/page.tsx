"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  UserCheck,
  Package,
  Truck,
  Wrench,
  Plus,
  Clock,
  LogOut,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface Ziyaretci {
  id: string;
  tip: "ZIYARETCI" | "KARGO" | "KURYE" | "HIZMET";
  adSoyad: string;
  tcKimlik: string | null;
  plaka: string | null;
  firma: string | null;
  not: string | null;
  girisTarihi: string;
  cikisTarihi: string | null;
  teslimAlindi: boolean;
  apartment: { no: string } | null;
  kaydeden: { ad: string; soyad: string };
}

interface Apartment {
  id: string;
  no: string;
}

const TIP_CONFIG: Record<
  string,
  { label: string; icon: typeof UserCheck; color: string }
> = {
  ZIYARETCI: {
    label: "Ziyaretçi",
    icon: UserCheck,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  KARGO: {
    label: "Kargo",
    icon: Package,
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  KURYE: {
    label: "Kurye",
    icon: Truck,
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  HIZMET: {
    label: "Hizmet",
    icon: Wrench,
    color:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
};

export default function ZiyaretcilerPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [ziyaretciler, setZiyaretciler] = useState<Ziyaretci[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("TUMU");

  // Form state
  const [tip, setTip] = useState<string>("ZIYARETCI");
  const [adSoyad, setAdSoyad] = useState("");
  const [tcKimlik, setTcKimlik] = useState("");
  const [plaka, setPlaka] = useState("");
  const [firma, setFirma] = useState("");
  const [not_, setNot] = useState("");
  const [apartmentId, setApartmentId] = useState("");

  const isYoneticiOrKapici =
    session?.user?.rol === "MASTER_ADMIN" || session?.user?.rol === "KAPICI";

  const fetchZiyaretciler = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ziyaretciler");
      if (res.ok) {
        setZiyaretciler(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchApartments = useCallback(async () => {
    try {
      const res = await fetch("/api/daireler");
      if (res.ok) {
        setApartments(await res.json());
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchZiyaretciler();
    fetchApartments();
  }, [fetchZiyaretciler, fetchApartments]);

  const resetForm = () => {
    setTip("ZIYARETCI");
    setAdSoyad("");
    setTcKimlik("");
    setPlaka("");
    setFirma("");
    setNot("");
    setApartmentId("");
  };

  const handleCreate = async () => {
    if (!adSoyad.trim()) {
      toast.error(
        t.visitors
          ? (t.visitors.nameRequired)
          : "Ad soyad zorunludur"
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/ziyaretciler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tip,
          adSoyad: adSoyad.trim(),
          tcKimlik: tcKimlik.trim() || undefined,
          plaka: plaka.trim() || undefined,
          firma: firma.trim() || undefined,
          not: not_.trim() || undefined,
          apartmentId: apartmentId || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error();
      }

      toast.success(
        t.visitors
          ? (t.visitors.createdSuccess)
          : "Kayıt başarıyla oluşturuldu"
      );
      setDialogOpen(false);
      resetForm();
      await fetchZiyaretciler();
    } catch {
      toast.error(t.errors?.generic || "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCikis = async (id: string) => {
    try {
      const res = await fetch(`/api/ziyaretciler/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cikisTarihi: new Date().toISOString() }),
      });

      if (res.ok) {
        toast.success(
          t.visitors
            ? (t.visitors.checkoutSuccess)
            : "Çıkış kaydedildi"
        );
        await fetchZiyaretciler();
      }
    } catch {
      toast.error(t.errors?.generic || "Bir hata oluştu");
    }
  };

  const handleTeslimAlindi = async (id: string) => {
    try {
      const res = await fetch(`/api/ziyaretciler/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teslimAlindi: true }),
      });

      if (res.ok) {
        toast.success(
          t.visitors
            ? (t.visitors.deliveredSuccess)
            : "Teslim alındı olarak işaretlendi"
        );
        await fetchZiyaretciler();
      }
    } catch {
      toast.error(t.errors?.generic || "Bir hata oluştu");
    }
  };

  const formatTarih = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const todayCount = ziyaretciler.filter((z) => {
    const today = new Date();
    const giris = new Date(z.girisTarihi);
    return (
      giris.getDate() === today.getDate() &&
      giris.getMonth() === today.getMonth() &&
      giris.getFullYear() === today.getFullYear()
    );
  }).length;

  const filtered =
    activeTab === "TUMU"
      ? ziyaretciler
      : ziyaretciler.filter((z) => z.tip === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-blue-500" />
            {t.visitors
              ? (t.visitors.title)
              : "Ziyaretçi/Kargo Yönetimi"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t.visitors
              ? (t.visitors.subtitle)
              : "Bina giriş-çıkış ve kargo takibi"}
          </p>
        </div>
        {isYoneticiOrKapici && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t.visitors
              ? (t.visitors.addNew)
              : "Yeni Kayıt"}
          </Button>
        )}
      </div>

      {/* Today's stat */}
      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.visitors
                ? (t.visitors.todayCount)
                : "Bugünkü Giriş"}
            </p>
            <p className="text-2xl font-bold">{todayCount}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="TUMU" onValueChange={(v) => setActiveTab(v as string)}>
        <TabsList>
          <TabsTrigger value="TUMU">
            {t.visitors
              ? (t.visitors.all)
              : "Tümü"}
          </TabsTrigger>
          <TabsTrigger value="ZIYARETCI">
            <UserCheck className="h-4 w-4 mr-1" />
            {TIP_CONFIG.ZIYARETCI.label}
          </TabsTrigger>
          <TabsTrigger value="KARGO">
            <Package className="h-4 w-4 mr-1" />
            {TIP_CONFIG.KARGO.label}
          </TabsTrigger>
          <TabsTrigger value="KURYE">
            <Truck className="h-4 w-4 mr-1" />
            {TIP_CONFIG.KURYE.label}
          </TabsTrigger>
          <TabsTrigger value="HIZMET">
            <Wrench className="h-4 w-4 mr-1" />
            {TIP_CONFIG.HIZMET.label}
          </TabsTrigger>
        </TabsList>

        {/* All tabs share the same content panel */}
        <TabsContent value="TUMU">
          <ZiyaretciList
            items={filtered}
            loading={loading}
            isYoneticiOrKapici={isYoneticiOrKapici}
            onCikis={handleCikis}
            onTeslimAlindi={handleTeslimAlindi}
            formatTarih={formatTarih}
            t={t}
          />
        </TabsContent>
        <TabsContent value="ZIYARETCI">
          <ZiyaretciList
            items={filtered}
            loading={loading}
            isYoneticiOrKapici={isYoneticiOrKapici}
            onCikis={handleCikis}
            onTeslimAlindi={handleTeslimAlindi}
            formatTarih={formatTarih}
            t={t}
          />
        </TabsContent>
        <TabsContent value="KARGO">
          <ZiyaretciList
            items={filtered}
            loading={loading}
            isYoneticiOrKapici={isYoneticiOrKapici}
            onCikis={handleCikis}
            onTeslimAlindi={handleTeslimAlindi}
            formatTarih={formatTarih}
            t={t}
          />
        </TabsContent>
        <TabsContent value="KURYE">
          <ZiyaretciList
            items={filtered}
            loading={loading}
            isYoneticiOrKapici={isYoneticiOrKapici}
            onCikis={handleCikis}
            onTeslimAlindi={handleTeslimAlindi}
            formatTarih={formatTarih}
            t={t}
          />
        </TabsContent>
        <TabsContent value="HIZMET">
          <ZiyaretciList
            items={filtered}
            loading={loading}
            isYoneticiOrKapici={isYoneticiOrKapici}
            onCikis={handleCikis}
            onTeslimAlindi={handleTeslimAlindi}
            formatTarih={formatTarih}
            t={t}
          />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-500" />
              {t.visitors
                ? (t.visitors.addTitle)
                : "Yeni Ziyaretçi/Kargo Kaydı"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {t.visitors
                  ? (t.visitors.type)
                  : "Tip"}
              </Label>
              <Select value={tip} onValueChange={(v) => setTip(v || "")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZIYARETCI">Ziyaretçi</SelectItem>
                  <SelectItem value="KARGO">Kargo</SelectItem>
                  <SelectItem value="KURYE">Kurye</SelectItem>
                  <SelectItem value="HIZMET">Hizmet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {t.visitors
                  ? (t.visitors.nameSurname)
                  : "Ad Soyad"}{" "}
                *
              </Label>
              <Input
                placeholder="Ad Soyad"
                value={adSoyad}
                onChange={(e) => setAdSoyad(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t.visitors
                    ? (t.visitors.tcId)
                    : "TC Kimlik No"}
                </Label>
                <Input
                  placeholder="TC Kimlik No"
                  value={tcKimlik}
                  onChange={(e) => setTcKimlik(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t.visitors
                    ? (t.visitors.plate)
                    : "Plaka"}
                </Label>
                <Input
                  placeholder="34 ABC 123"
                  value={plaka}
                  onChange={(e) => setPlaka(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t.visitors
                    ? (t.visitors.company)
                    : "Firma"}
                </Label>
                <Input
                  placeholder="Firma adı"
                  value={firma}
                  onChange={(e) => setFirma(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t.visitors
                    ? (t.visitors.apartment)
                    : "Daire"}
                </Label>
                <Select value={apartmentId} onValueChange={(v) => setApartmentId(v || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Daire seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {apartments.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id}>
                        {apt.no}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                {t.visitors
                  ? (t.visitors.note)
                  : "Not"}
              </Label>
              <Input
                placeholder="Ek not"
                value={not_}
                onChange={(e) => setNot(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting
                ? (t.common?.sending || "Gönderiliyor...")
                : (t.common?.submit || "Kaydet")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ZiyaretciList({
  items,
  loading,
  isYoneticiOrKapici,
  onCikis,
  onTeslimAlindi,
  formatTarih,
  t,
}: {
  items: Ziyaretci[];
  loading: boolean;
  isYoneticiOrKapici: boolean;
  onCikis: (id: string) => Promise<void>;
  onTeslimAlindi: (id: string) => Promise<void>;
  formatTarih: (dateStr: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  if (loading) {
    return (
      <p className="text-gray-500 text-sm py-4">
        {t.common.loading}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            {t.visitors?.noRecords ||
              "Kayıt bulunamadı"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((z) => {
        const config = TIP_CONFIG[z.tip];
        const Icon = config.icon;
        const isActive = !z.cikisTarihi;
        const isKargoType = z.tip === "KARGO" || z.tip === "KURYE";

        return (
          <Card key={z.id}>
            <CardContent className="flex items-center gap-4 py-4">
              {/* Type icon */}
              <div className="shrink-0">
                <div
                  className={`rounded-full p-2.5 ${
                    isActive
                      ? "bg-green-100 dark:bg-green-900"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isActive
                        ? "text-green-600 dark:text-green-300"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold truncate">{z.adSoyad}</span>
                  <Badge className={config.color}>{config.label}</Badge>
                  {isActive ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Aktif
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      Çıkış Yapıldı
                    </Badge>
                  )}
                  {isKargoType && z.teslimAlindi && (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Teslim Alındı
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {z.apartment && <span>Daire {z.apartment.no}</span>}
                  {z.firma && <span>{z.firma}</span>}
                  {z.plaka && <span>{z.plaka}</span>}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTarih(z.girisTarihi)}
                  </span>
                  {z.cikisTarihi && (
                    <span className="flex items-center gap-1">
                      <LogOut className="h-3.5 w-3.5" />
                      {formatTarih(z.cikisTarihi)}
                    </span>
                  )}
                </div>
                {z.not && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                    {z.not}
                  </p>
                )}
              </div>

              {/* Actions */}
              {isYoneticiOrKapici && (
                <div className="flex items-center gap-2 shrink-0">
                  {isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCikis(z.id)}
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Çıkış
                    </Button>
                  )}
                  {isKargoType && !z.teslimAlindi && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTeslimAlindi(z.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Teslim
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
