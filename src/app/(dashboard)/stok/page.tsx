"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface StokMalzeme {
  id: string;
  ad: string;
  kategori: string;
  birim: string;
  miktar: number | string;
  minimumMiktar: number | string | null;
  birimFiyat: number | string | null;
  konum: string | null;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
  buildingId: string;
  _count: { hareketler: number };
}

interface StokHareket {
  id: string;
  tip: "GIRIS" | "CIKIS";
  miktar: number | string;
  aciklama: string | null;
  createdAt: string;
  islemYapan: { ad: string; soyad: string };
}

const KATEGORI_OPTIONS = [
  { value: "Temizlik", label: "Temizlik" },
  { value: "Elektrik", label: "Elektrik" },
  { value: "Su/Tesisat", label: "Su/Tesisat" },
  { value: "Bahce", label: "Bahce" },
  { value: "Guvenlik", label: "Guvenlik" },
  { value: "Genel", label: "Genel" },
];

const BIRIM_OPTIONS = [
  { value: "ADET", label: "Adet" },
  { value: "KG", label: "Kg" },
  { value: "LT", label: "Lt" },
  { value: "MT", label: "Mt" },
  { value: "PAKET", label: "Paket" },
];

function getKategoriBadgeColor(kategori: string) {
  switch (kategori) {
    case "Temizlik":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
    case "Elektrik":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "Su/Tesisat":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "Bahce":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "Guvenlik":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

export default function StokPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [malzemeler, setMalzemeler] = useState<StokMalzeme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hareketDialogOpen, setHareketDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hareketler, setHareketler] = useState<Record<string, StokHareket[]>>({});
  const [hareketLoading, setHareketLoading] = useState<string | null>(null);

  // New material form
  const [ad, setAd] = useState("");
  const [kategori, setKategori] = useState("");
  const [birim, setBirim] = useState("ADET");
  const [miktar, setMiktar] = useState("");
  const [minimumMiktar, setMinimumMiktar] = useState("");
  const [birimFiyat, setBirimFiyat] = useState("");
  const [konum, setKonum] = useState("");

  // Movement form
  const [hareketMalzemeId, setHareketMalzemeId] = useState("");
  const [hareketMalzemeAd, setHareketMalzemeAd] = useState("");
  const [hareketTip, setHareketTip] = useState<"GIRIS" | "CIKIS">("GIRIS");
  const [hareketMiktar, setHareketMiktar] = useState("");
  const [hareketAciklama, setHareketAciklama] = useState("");

  const userRole = (session?.user as { rol?: string })?.rol;
  const canManage = userRole === "MASTER_ADMIN" || userRole === "KAPICI";

  const fetchMalzemeler = useCallback(async () => {
    try {
      const res = await fetch("/api/stok");
      if (res.ok) {
        const data = await res.json();
        setMalzemeler(data);
      }
    } catch (error) {
      console.error("Stok yuklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMalzemeler();
  }, [fetchMalzemeler]);

  const fetchHareketler = async (malzemeId: string) => {
    setHareketLoading(malzemeId);
    try {
      const res = await fetch(`/api/stok/${malzemeId}/hareket`);
      if (res.ok) {
        const data = await res.json();
        setHareketler((prev) => ({ ...prev, [malzemeId]: data }));
      }
    } catch (error) {
      console.error("Hareketler yuklenirken hata:", error);
    } finally {
      setHareketLoading(null);
    }
  };

  const toggleExpanded = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!hareketler[id]) {
        fetchHareketler(id);
      }
    }
  };

  const resetForm = () => {
    setAd("");
    setKategori("");
    setBirim("ADET");
    setMiktar("");
    setMinimumMiktar("");
    setBirimFiyat("");
    setKonum("");
  };

  const resetHareketForm = () => {
    setHareketMalzemeId("");
    setHareketMalzemeAd("");
    setHareketTip("GIRIS");
    setHareketMiktar("");
    setHareketAciklama("");
  };

  const handleSubmit = async () => {
    if (!ad.trim()) {
      toast.error("Malzeme adi zorunludur");
      return;
    }
    if (!kategori) {
      toast.error("Kategori zorunludur");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/stok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad: ad.trim(),
          kategori,
          birim,
          miktar: miktar || "0",
          minimumMiktar: minimumMiktar || undefined,
          birimFiyat: birimFiyat || undefined,
          konum: konum.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Malzeme basariyla eklendi");
        setDialogOpen(false);
        resetForm();
        fetchMalzemeler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Malzeme eklenirken hata olustu");
      }
    } catch {
      toast.error("Malzeme eklenirken hata olustu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/stok/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Malzeme silindi");
        fetchMalzemeler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Malzeme silinirken hata olustu");
      }
    } catch {
      toast.error("Malzeme silinirken hata olustu");
    }
  };

  const openHareketDialog = (malzeme: StokMalzeme, tip: "GIRIS" | "CIKIS") => {
    setHareketMalzemeId(malzeme.id);
    setHareketMalzemeAd(malzeme.ad);
    setHareketTip(tip);
    setHareketMiktar("");
    setHareketAciklama("");
    setHareketDialogOpen(true);
  };

  const handleHareketSubmit = async () => {
    if (!hareketMiktar || parseFloat(hareketMiktar) <= 0) {
      toast.error("Miktar sifirdan buyuk olmalidir");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/stok/${hareketMalzemeId}/hareket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tip: hareketTip,
          miktar: hareketMiktar,
          aciklama: hareketAciklama.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success(
          hareketTip === "GIRIS" ? "Stok girisi yapildi" : "Stok cikisi yapildi"
        );
        setHareketDialogOpen(false);
        resetHareketForm();
        fetchMalzemeler();
        // Refresh movements if expanded
        if (expandedId === hareketMalzemeId) {
          fetchHareketler(hareketMalzemeId);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Stok hareketi eklenirken hata olustu");
      }
    } catch {
      toast.error("Stok hareketi eklenirken hata olustu");
    } finally {
      setSubmitting(false);
    }
  };

  const isLowStock = (m: StokMalzeme) => {
    if (m.minimumMiktar === null || m.minimumMiktar === undefined) return false;
    return Number(m.miktar) < Number(m.minimumMiktar);
  };

  const filteredMalzemeler = malzemeler.filter((m) => {
    const matchesSearch = m.ad.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKategori = !kategoriFilter || m.kategori === kategoriFilter;
    return matchesSearch && matchesKategori;
  });

  const lowStockCount = malzemeler.filter(isLowStock).length;

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
            Stok / Malzeme Takibi
          </h1>
          <p className="text-muted-foreground">
            Bina malzeme ve stok yonetimi
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Malzeme Ekle
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Malzeme</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{malzemeler.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori Sayisi</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(malzemeler.map((m) => m.kategori)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dusuk Stok Uyarisi</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lowStockCount > 0 ? "text-destructive" : ""}`}>
              {lowStockCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Malzeme ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={kategoriFilter} onValueChange={(v) => setKategoriFilter(v === "all" ? "" : (v || ""))}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Tum Kategoriler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tum Kategoriler</SelectItem>
            {KATEGORI_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Material List */}
      {filteredMalzemeler.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchQuery || kategoriFilter
                ? "Sonuc bulunamadi"
                : "Henuz malzeme kaydi yok"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMalzemeler.map((malzeme) => (
            <Card key={malzeme.id} className={isLowStock(malzeme) ? "border-destructive" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {malzeme.ad}
                        {isLowStock(malzeme) && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Dusuk Stok
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getKategoriBadgeColor(malzeme.kategori)}>
                          {malzeme.kategori}
                        </Badge>
                        {malzeme.konum && (
                          <span className="text-sm text-muted-foreground">
                            Konum: {malzeme.konum}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <div className="text-2xl font-bold">
                        {Number(malzeme.miktar)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {BIRIM_OPTIONS.find((b) => b.value === malzeme.birim)?.label || malzeme.birim}
                        {malzeme.minimumMiktar !== null && (
                          <span> / Min: {Number(malzeme.minimumMiktar)}</span>
                        )}
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => openHareketDialog(malzeme, "GIRIS")}
                          title="Stok Girisi"
                        >
                          <ArrowDownCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => openHareketDialog(malzeme, "CIKIS")}
                          title="Stok Cikisi"
                        >
                          <ArrowUpCircle className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(malzeme.id)}
                          className="text-destructive hover:text-destructive"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex gap-4">
                    {malzeme.birimFiyat !== null && (
                      <span>Birim Fiyat: {Number(malzeme.birimFiyat)} TL</span>
                    )}
                    <span>Hareket: {malzeme._count.hareketler}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(malzeme.id)}
                    className="text-muted-foreground"
                  >
                    {expandedId === malzeme.id ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Gizle
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Hareketler
                      </>
                    )}
                  </Button>
                </div>

                {/* Expanded movement history */}
                {expandedId === malzeme.id && (
                  <div className="mt-4 border-t pt-4">
                    {hareketLoading === malzeme.id ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Yukleniyor...
                      </p>
                    ) : !hareketler[malzeme.id] || hareketler[malzeme.id].length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Henuz hareket kaydi yok
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {hareketler[malzeme.id].map((h) => (
                          <div
                            key={h.id}
                            className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50"
                          >
                            <div className="flex items-center gap-2">
                              {h.tip === "GIRIS" ? (
                                <ArrowDownCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <ArrowUpCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="font-medium">
                                {h.tip === "GIRIS" ? "+" : "-"}{Number(h.miktar)}{" "}
                                {BIRIM_OPTIONS.find((b) => b.value === malzeme.birim)?.label || malzeme.birim}
                              </span>
                              {h.aciklama && (
                                <span className="text-muted-foreground">
                                  - {h.aciklama}
                                </span>
                              )}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              <span>{h.islemYapan.ad} {h.islemYapan.soyad}</span>
                              <span className="ml-2">
                                {new Date(h.createdAt).toLocaleDateString("tr-TR")}{" "}
                                {new Date(h.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Material Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Malzeme Ekle
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Malzeme Adi *</Label>
              <Input
                placeholder="Ornek: Camasir Suyu"
                value={ad}
                onChange={(e) => setAd(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <Select value={kategori} onValueChange={(v) => setKategori(v || "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Secin" />
                  </SelectTrigger>
                  <SelectContent>
                    {KATEGORI_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Birim</Label>
                <Select value={birim} onValueChange={(v) => setBirim(v || "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BIRIM_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Baslangic Miktari</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={miktar}
                  onChange={(e) => setMiktar(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Miktar</Label>
                <Input
                  type="number"
                  placeholder="Opsiyonel"
                  value={minimumMiktar}
                  onChange={(e) => setMinimumMiktar(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Birim Fiyat (TL)</Label>
                <Input
                  type="number"
                  placeholder="Opsiyonel"
                  value={birimFiyat}
                  onChange={(e) => setBirimFiyat(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>Konum</Label>
                <Input
                  placeholder="Ornek: Depo A"
                  value={konum}
                  onChange={(e) => setKonum(e.target.value)}
                />
              </div>
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
              {submitting ? (t.common?.saving || "Kaydediliyor...") : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Movement Dialog */}
      <Dialog open={hareketDialogOpen} onOpenChange={(open) => { if (!open) { setHareketDialogOpen(false); resetHareketForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {hareketTip === "GIRIS" ? (
                <ArrowDownCircle className="h-5 w-5 text-green-600" />
              ) : (
                <ArrowUpCircle className="h-5 w-5 text-red-600" />
              )}
              {hareketTip === "GIRIS" ? "Stok Girisi" : "Stok Cikisi"} - {hareketMalzemeAd}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Miktar *</Label>
              <Input
                type="number"
                placeholder="Miktar girin"
                value={hareketMiktar}
                onChange={(e) => setHareketMiktar(e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>Aciklama</Label>
              <Textarea
                placeholder="Opsiyonel aciklama..."
                value={hareketAciklama}
                onChange={(e) => setHareketAciklama(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setHareketDialogOpen(false); resetHareketForm(); }}
            >
              {t.common?.cancel || "Iptal"}
            </Button>
            <Button onClick={handleHareketSubmit} disabled={submitting}>
              {submitting
                ? (t.common?.saving || "Kaydediliyor...")
                : hareketTip === "GIRIS"
                  ? "Giris Yap"
                  : "Cikis Yap"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
