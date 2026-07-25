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
  Trash2,
  Edit,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface Demirbas {
  id: string;
  ad: string;
  kategori: string;
  marka: string | null;
  model: string | null;
  seriNo: string | null;
  konum: string | null;
  durum: string;
  edinmeTarihi: string | null;
  garantiBitis: string | null;
  deger: string | null;
  fotografYolu: string | null;
  not: string | null;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
  buildingId: string;
}

const KATEGORI_OPTIONS = [
  { value: "Mobilya", label: "Mobilya" },
  { value: "Elektronik", label: "Elektronik" },
  { value: "Beyaz Esya", label: "Beyaz Esya" },
  { value: "Bahce", label: "Bahce" },
  { value: "Temizlik", label: "Temizlik" },
  { value: "Guvenlik", label: "Guvenlik" },
  { value: "Diger", label: "Diger" },
];

const DURUM_OPTIONS = [
  { value: "AKTIF", label: "Aktif" },
  { value: "BAKIM_GEREKLI", label: "Bakim Gerekli" },
  { value: "ARIZALI", label: "Arizali" },
  { value: "KULLANIM_DISI", label: "Kullanim Disi" },
];

function getDurumBadgeColor(durum: string) {
  switch (durum) {
    case "AKTIF":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "BAKIM_GEREKLI":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "ARIZALI":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "KULLANIM_DISI":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  }
}

function getDurumLabel(durum: string) {
  return DURUM_OPTIONS.find((o) => o.value === durum)?.label || durum;
}

export default function DemirbaslarPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [demirbaslar, setDemirbaslar] = useState<Demirbas[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [filterDurum, setFilterDurum] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [ad, setAd] = useState("");
  const [kategori, setKategori] = useState("");
  const [marka, setMarka] = useState("");
  const [model, setModel] = useState("");
  const [seriNo, setSeriNo] = useState("");
  const [konum, setKonum] = useState("");
  const [durum, setDurum] = useState("AKTIF");
  const [edinmeTarihi, setEdinmeTarihi] = useState("");
  const [garantiBitis, setGarantiBitis] = useState("");
  const [deger, setDeger] = useState("");
  const [notText, setNotText] = useState("");

  const userRole = (session?.user as { rol?: string })?.rol;
  const canManage = userRole === "MASTER_ADMIN" || userRole === "KAPICI";

  const fetchDemirbaslar = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterKategori) params.set("kategori", filterKategori);
      if (filterDurum) params.set("durum", filterDurum);
      const queryStr = params.toString();
      const res = await fetch(`/api/demirbaslar${queryStr ? `?${queryStr}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setDemirbaslar(data);
      }
    } catch (error) {
      console.error("Demirbaslar yuklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, [filterKategori, filterDurum]);

  useEffect(() => {
    fetchDemirbaslar();
  }, [fetchDemirbaslar]);

  const resetForm = () => {
    setAd("");
    setKategori("");
    setMarka("");
    setModel("");
    setSeriNo("");
    setKonum("");
    setDurum("AKTIF");
    setEdinmeTarihi("");
    setGarantiBitis("");
    setDeger("");
    setNotText("");
    setEditingId(null);
  };

  const openEditDialog = (item: Demirbas) => {
    setEditingId(item.id);
    setAd(item.ad);
    setKategori(item.kategori);
    setMarka(item.marka || "");
    setModel(item.model || "");
    setSeriNo(item.seriNo || "");
    setKonum(item.konum || "");
    setDurum(item.durum);
    setEdinmeTarihi(item.edinmeTarihi ? item.edinmeTarihi.split("T")[0] : "");
    setGarantiBitis(item.garantiBitis ? item.garantiBitis.split("T")[0] : "");
    setDeger(item.deger || "");
    setNotText(item.not || "");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!ad.trim()) {
      toast.error("Demirbas adi zorunludur");
      return;
    }

    if (!kategori) {
      toast.error("Kategori zorunludur");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ad: ad.trim(),
        kategori,
        marka: marka.trim() || undefined,
        model: model.trim() || undefined,
        seriNo: seriNo.trim() || undefined,
        konum: konum.trim() || undefined,
        durum,
        edinmeTarihi: edinmeTarihi || undefined,
        garantiBitis: garantiBitis || undefined,
        deger: deger || undefined,
        not: notText.trim() || undefined,
      };

      let res: Response;

      if (editingId) {
        res = await fetch(`/api/demirbaslar/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/demirbaslar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success(editingId ? "Demirbas guncellendi" : "Demirbas basariyla eklendi");
        setDialogOpen(false);
        resetForm();
        fetchDemirbaslar();
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

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/demirbaslar/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Demirbas silindi");
        fetchDemirbaslar();
      } else {
        const data = await res.json();
        toast.error(data.error || "Demirbas silinirken hata olustu");
      }
    } catch {
      toast.error("Demirbas silinirken hata olustu");
    }
  };

  const filteredDemirbaslar = demirbaslar.filter((item) =>
    item.ad.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.marka && item.marka.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.konum && item.konum.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const aktifCount = demirbaslar.filter((d) => d.durum === "AKTIF").length;
  const bakimCount = demirbaslar.filter((d) => d.durum === "BAKIM_GEREKLI" || d.durum === "ARIZALI").length;

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
            Demirbas Takip Sistemi
          </h1>
          <p className="text-muted-foreground">
            Bina demirbaslarini yonetin ve takip edin
          </p>
        </div>
        {canManage && (
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Demirbas Ekle
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Demirbas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demirbaslar.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aktifCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bakim / Ariza</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bakimCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Ada, markaya veya konuma gore ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterKategori || "all"} onValueChange={(v) => setFilterKategori(v === "all" ? "" : (v || ""))}>
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Kategori" />
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
          <Select value={filterDurum || "all"} onValueChange={(v) => setFilterDurum(v === "all" ? "" : (v || ""))}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tum Durumlar</SelectItem>
              {DURUM_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Demirbaslar Grid */}
      {filteredDemirbaslar.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchQuery || filterKategori || filterDurum
                ? "Sonuc bulunamadi"
                : "Henuz demirbas kaydi yok"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDemirbaslar.map((item) => (
            <Card key={item.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    <CardTitle className="text-lg font-bold">
                      {item.ad}
                    </CardTitle>
                  </div>
                  <Badge className={getDurumBadgeColor(item.durum)}>
                    {getDurumLabel(item.durum)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.kategori}</Badge>
                </div>
                {(item.marka || item.model) && (
                  <p className="text-sm text-muted-foreground">
                    {[item.marka, item.model].filter(Boolean).join(" ")}
                  </p>
                )}
                {item.seriNo && (
                  <p className="text-sm text-muted-foreground">
                    Seri No: {item.seriNo}
                  </p>
                )}
                {item.konum && (
                  <p className="text-sm text-muted-foreground">
                    Konum: {item.konum}
                  </p>
                )}
                {item.deger && (
                  <p className="text-sm text-muted-foreground">
                    Deger: {parseFloat(item.deger).toLocaleString("tr-TR")} TL
                  </p>
                )}
                {item.garantiBitis && (
                  <p className="text-sm text-muted-foreground">
                    Garanti Bitis: {new Date(item.garantiBitis).toLocaleDateString("tr-TR")}
                  </p>
                )}
                {canManage && (
                  <div className="pt-2 border-t flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit className="h-4 w-4" />
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
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {editingId ? "Demirbas Duzenle" : "Demirbas Ekle"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Demirbas Adi *</Label>
              <Input
                placeholder="Orn: Asansor Motoru"
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
                <Label>Durum</Label>
                <Select value={durum} onValueChange={(v) => setDurum(v || "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURUM_OPTIONS.map((opt) => (
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
                <Label>Marka</Label>
                <Input
                  placeholder="Orn: Bosch"
                  value={marka}
                  onChange={(e) => setMarka(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  placeholder="Orn: XYZ-100"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Seri No</Label>
                <Input
                  placeholder="Seri numarasi"
                  value={seriNo}
                  onChange={(e) => setSeriNo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Konum</Label>
                <Input
                  placeholder="Orn: Bodrum kat"
                  value={konum}
                  onChange={(e) => setKonum(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Edinme Tarihi</Label>
                <Input
                  type="date"
                  value={edinmeTarihi}
                  onChange={(e) => setEdinmeTarihi(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Garanti Bitis</Label>
                <Input
                  type="date"
                  value={garantiBitis}
                  onChange={(e) => setGarantiBitis(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Deger (TL)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={deger}
                onChange={(e) => setDeger(e.target.value)}
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
