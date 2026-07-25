"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Car,
  Bike,
  Truck,
  Plus,
  Trash2,
  Search,
  ParkingCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface Arac {
  id: string;
  plaka: string;
  marka: string | null;
  model: string | null;
  renk: string | null;
  tip: string;
  parkYeri: string | null;
  userId: string;
  apartmentId: string | null;
  user: { ad: string; soyad: string };
  apartment: { no: string } | null;
}

const TIP_OPTIONS = [
  { value: "OTOMOBIL", label: "Otomobil" },
  { value: "MOTOSIKLET", label: "Motosiklet" },
  { value: "KAMYONET", label: "Kamyonet" },
];

function getTipIcon(tip: string) {
  switch (tip) {
    case "MOTOSIKLET":
      return <Bike className="h-5 w-5" />;
    case "KAMYONET":
      return <Truck className="h-5 w-5" />;
    default:
      return <Car className="h-5 w-5" />;
  }
}

function getTipBadgeColor(tip: string) {
  switch (tip) {
    case "MOTOSIKLET":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "KAMYONET":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  }
}

export default function AraclarPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [araclar, setAraclar] = useState<Arac[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [plaka, setPlaka] = useState("");
  const [marka, setMarka] = useState("");
  const [model, setModel] = useState("");
  const [renk, setRenk] = useState("");
  const [tip, setTip] = useState("OTOMOBIL");
  const [parkYeri, setParkYeri] = useState("");

  const userRole = (session?.user as { rol?: string })?.rol;
  const userId = (session?.user as { id?: string })?.id;

  const fetchAraclar = useCallback(async () => {
    try {
      const res = await fetch("/api/araclar");
      if (res.ok) {
        const data = await res.json();
        setAraclar(data);
      }
    } catch (error) {
      console.error("Araclar yuklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAraclar();
  }, [fetchAraclar]);

  const resetForm = () => {
    setPlaka("");
    setMarka("");
    setModel("");
    setRenk("");
    setTip("OTOMOBIL");
    setParkYeri("");
  };

  const handleSubmit = async () => {
    if (!plaka.trim()) {
      toast.error(t.vehicles?.plateRequired || "Plaka zorunludur");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/araclar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plaka: plaka.trim(),
          marka: marka.trim() || undefined,
          model: model.trim() || undefined,
          renk: renk.trim() || undefined,
          tip,
          parkYeri: parkYeri.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success(t.vehicles?.addSuccess || "Arac basariyla eklendi");
        setDialogOpen(false);
        resetForm();
        fetchAraclar();
      } else {
        const data = await res.json();
        toast.error(data.error || t.vehicles?.addError || "Arac eklenirken hata olustu");
      }
    } catch {
      toast.error(t.vehicles?.addError || "Arac eklenirken hata olustu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/araclar?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(t.vehicles?.deleteSuccess || "Arac silindi");
        fetchAraclar();
      } else {
        const data = await res.json();
        toast.error(data.error || t.vehicles?.deleteError || "Arac silinirken hata olustu");
      }
    } catch {
      toast.error(t.vehicles?.deleteError || "Arac silinirken hata olustu");
    }
  };

  const filteredAraclar = araclar.filter((arac) =>
    arac.plaka.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const parkingUsed = araclar.filter((a) => a.parkYeri).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t.vehicles?.title || "Arac Kayit Sistemi"}
          </h1>
          <p className="text-muted-foreground">
            {t.vehicles?.subtitle || "Bina araclarini yonetin"}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t.vehicles?.addVehicle || "Arac Ekle"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.vehicles?.totalVehicles || "Toplam Arac"}
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{araclar.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.vehicles?.parkingUsed || "Kullanilan Park Yeri"}
            </CardTitle>
            <ParkingCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parkingUsed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t.vehicles?.searchPlaceholder || "Plakaya gore ara..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Vehicle Grid */}
      {filteredAraclar.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchQuery
                ? (t.vehicles?.noResults || "Sonuc bulunamadi")
                : (t.vehicles?.noVehicles || "Henuz arac kaydi yok")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAraclar.map((arac) => (
            <Card key={arac.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTipIcon(arac.tip)}
                    <CardTitle className="text-lg font-bold tracking-wider">
                      {arac.plaka}
                    </CardTitle>
                  </div>
                  <Badge className={getTipBadgeColor(arac.tip)}>
                    {TIP_OPTIONS.find((o) => o.value === arac.tip)?.label || arac.tip}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {(arac.marka || arac.model) && (
                  <p className="text-sm text-muted-foreground">
                    {[arac.marka, arac.model].filter(Boolean).join(" ")}
                  </p>
                )}
                {arac.renk && (
                  <p className="text-sm text-muted-foreground">
                    {t.vehicles?.color || "Renk"}: {arac.renk}
                  </p>
                )}
                {arac.parkYeri && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ParkingCircle className="h-3.5 w-3.5" />
                    {arac.parkYeri}
                  </div>
                )}
                <div className="pt-2 border-t flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">
                      {arac.user.ad} {arac.user.soyad}
                    </span>
                    {arac.apartment && (
                      <span className="text-muted-foreground">
                        {" "}
                        - {t.vehicles?.apartment || "Daire"} {arac.apartment.no}
                      </span>
                    )}
                  </div>
                  {(arac.userId === userId || userRole === "MASTER_ADMIN") && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(arac.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Vehicle Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              {t.vehicles?.addVehicle || "Arac Ekle"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.vehicles?.plate || "Plaka"} *</Label>
              <Input
                placeholder="34 ABC 123"
                value={plaka}
                onChange={(e) => setPlaka(e.target.value.toUpperCase())}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.vehicles?.brand || "Marka"}</Label>
                <Input
                  placeholder="Toyota"
                  value={marka}
                  onChange={(e) => setMarka(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.vehicles?.model || "Model"}</Label>
                <Input
                  placeholder="Corolla"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.vehicles?.color || "Renk"}</Label>
                <Input
                  placeholder="Beyaz"
                  value={renk}
                  onChange={(e) => setRenk(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.vehicles?.type || "Tip"}</Label>
                <Select value={tip} onValueChange={(v) => setTip(v || "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIP_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.vehicles?.parkingSpot || "Park Yeri"}</Label>
              <Input
                placeholder="A-12"
                value={parkYeri}
                onChange={(e) => setParkYeri(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); resetForm(); }}
            >
              {t.common?.cancel || "Iptal"}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? (t.common?.saving || "Kaydediliyor...")
                : (t.vehicles?.save || "Kaydet")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
