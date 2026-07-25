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
  Package,
  Plus,
  CheckCircle,
  Truck,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface PaketKargo {
  id: string;
  aliciAdi: string;
  daireBilgisi: string;
  kargoFirmasi: string | null;
  takipNo: string | null;
  teslimTarihi: string;
  alimTarihi: string | null;
  teslimEdildi: boolean;
  fotografYolu: string | null;
  not: string | null;
  createdAt: string;
  updatedAt: string;
  buildingId: string;
  aliciId: string | null;
  teslimEdenId: string | null;
  alici: { id: string; name: string | null } | null;
  teslimEden: { id: string; name: string | null } | null;
}

const KARGO_FIRMALARI = [
  { value: "Aras", label: "Aras Kargo" },
  { value: "Yurtici", label: "Yurtici Kargo" },
  { value: "MNG", label: "MNG Kargo" },
  { value: "PTT", label: "PTT Kargo" },
  { value: "Surat", label: "Surat Kargo" },
  { value: "UPS", label: "UPS" },
  { value: "DHL", label: "DHL" },
  { value: "Diger", label: "Diger" },
];

export default function PaketlerPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [paketler, setPaketler] = useState<PaketKargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDurum, setFilterDurum] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [aliciAdi, setAliciAdi] = useState("");
  const [daireBilgisi, setDaireBilgisi] = useState("");
  const [kargoFirmasi, setKargoFirmasi] = useState("");
  const [takipNo, setTakipNo] = useState("");
  const [notText, setNotText] = useState("");

  const userRole = (session?.user as { rol?: string })?.rol;
  const canManage = userRole === "MASTER_ADMIN" || userRole === "KAPICI";

  const fetchPaketler = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterDurum === "bekleyen") params.set("teslimEdildi", "false");
      if (filterDurum === "teslim") params.set("teslimEdildi", "true");
      const queryStr = params.toString();
      const res = await fetch(`/api/paketler${queryStr ? `?${queryStr}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setPaketler(data);
      }
    } catch (error) {
      console.error("Paketler yuklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, [filterDurum]);

  useEffect(() => {
    fetchPaketler();
  }, [fetchPaketler]);

  const resetForm = () => {
    setAliciAdi("");
    setDaireBilgisi("");
    setKargoFirmasi("");
    setTakipNo("");
    setNotText("");
  };

  const handleSubmit = async () => {
    if (!aliciAdi.trim()) {
      toast.error("Alici adi zorunludur");
      return;
    }

    if (!daireBilgisi.trim()) {
      toast.error("Daire bilgisi zorunludur");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        aliciAdi: aliciAdi.trim(),
        daireBilgisi: daireBilgisi.trim(),
        kargoFirmasi: kargoFirmasi || undefined,
        takipNo: takipNo.trim() || undefined,
        not: notText.trim() || undefined,
      };

      const res = await fetch("/api/paketler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Paket basariyla kaydedildi");
        setDialogOpen(false);
        resetForm();
        fetchPaketler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Islem sirasinda hata olustu");
      }
    } catch {
      toast.error("Islem sirasinda hata olustu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTeslimEt = async (id: string) => {
    try {
      const res = await fetch(`/api/paketler/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teslimEdildi: true }),
      });

      if (res.ok) {
        toast.success("Paket teslim edildi olarak isaretlendi");
        fetchPaketler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Islem sirasinda hata olustu");
      }
    } catch {
      toast.error("Islem sirasinda hata olustu");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/paketler/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Paket silindi");
        fetchPaketler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Paket silinirken hata olustu");
      }
    } catch {
      toast.error("Paket silinirken hata olustu");
    }
  };

  const filteredPaketler = paketler.filter(
    (item) =>
      item.aliciAdi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.daireBilgisi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const bekleyenPaketler = filteredPaketler.filter((p) => !p.teslimEdildi);
  const teslimEdilenPaketler = filteredPaketler.filter((p) => p.teslimEdildi);

  const totalBekleyen = paketler.filter((p) => !p.teslimEdildi).length;
  const totalTeslim = paketler.filter((p) => p.teslimEdildi).length;

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
            Paket / Kargo Takibi
          </h1>
          <p className="text-muted-foreground">
            Binaya gelen paket ve kargolari takip edin
          </p>
        </div>
        {canManage && (
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Paket Ekle
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Paketler</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBekleyen}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teslim Edilen</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeslim}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paketler.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Alici adi veya daire bilgisine gore ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterDurum || "all"} onValueChange={(v) => setFilterDurum(v === "all" ? "" : (v || ""))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tumu</SelectItem>
            <SelectItem value="bekleyen">Bekleyen</SelectItem>
            <SelectItem value="teslim">Teslim Edildi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Empty State */}
      {filteredPaketler.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchQuery || filterDurum
                ? "Sonuc bulunamadi"
                : "Henuz paket kaydi yok"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Bekleyen Paketler */}
          {bekleyenPaketler.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Bekleyen Paketler</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bekleyenPaketler.map((item) => (
                  <Card key={item.id} className="relative border-orange-200 dark:border-orange-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          <CardTitle className="text-lg font-bold">
                            {item.aliciAdi}
                          </CardTitle>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          Bekliyor
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Daire: {item.daireBilgisi}
                      </p>
                      {item.kargoFirmasi && (
                        <p className="text-sm text-muted-foreground">
                          Kargo: {item.kargoFirmasi}
                        </p>
                      )}
                      {item.takipNo && (
                        <p className="text-sm text-muted-foreground">
                          Takip No: {item.takipNo}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Gelis Tarihi: {new Date(item.teslimTarihi).toLocaleDateString("tr-TR")}
                      </p>
                      {item.not && (
                        <p className="text-sm text-muted-foreground">
                          Not: {item.not}
                        </p>
                      )}
                      {canManage && (
                        <div className="pt-2 border-t flex items-center justify-end gap-1">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleTeslimEt(item.id)}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Teslim Edildi
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Teslim Edilen Paketler */}
          {teslimEdilenPaketler.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Teslim Edilen Paketler</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teslimEdilenPaketler.map((item) => (
                  <Card key={item.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          <CardTitle className="text-lg font-bold">
                            {item.aliciAdi}
                          </CardTitle>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Teslim Edildi
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Daire: {item.daireBilgisi}
                      </p>
                      {item.kargoFirmasi && (
                        <p className="text-sm text-muted-foreground">
                          Kargo: {item.kargoFirmasi}
                        </p>
                      )}
                      {item.takipNo && (
                        <p className="text-sm text-muted-foreground">
                          Takip No: {item.takipNo}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Gelis Tarihi: {new Date(item.teslimTarihi).toLocaleDateString("tr-TR")}
                      </p>
                      {item.alimTarihi && (
                        <p className="text-sm text-muted-foreground">
                          Teslim Tarihi: {new Date(item.alimTarihi).toLocaleDateString("tr-TR")}
                        </p>
                      )}
                      {item.not && (
                        <p className="text-sm text-muted-foreground">
                          Not: {item.not}
                        </p>
                      )}
                      {canManage && (
                        <div className="pt-2 border-t flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Package Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Paket Ekle
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alici Adi *</Label>
              <Input
                placeholder="Orn: Ahmet Yilmaz"
                value={aliciAdi}
                onChange={(e) => setAliciAdi(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Daire Bilgisi *</Label>
              <Input
                placeholder="Orn: Daire 5"
                value={daireBilgisi}
                onChange={(e) => setDaireBilgisi(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Kargo Firmasi</Label>
              <Select value={kargoFirmasi} onValueChange={(v) => setKargoFirmasi(v || "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Secin" />
                </SelectTrigger>
                <SelectContent>
                  {KARGO_FIRMALARI.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Takip No</Label>
              <Input
                placeholder="Kargo takip numarasi"
                value={takipNo}
                onChange={(e) => setTakipNo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Not</Label>
              <Input
                placeholder="Ek bilgi veya aciklama"
                value={notText}
                onChange={(e) => setNotText(e.target.value)}
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
                : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
