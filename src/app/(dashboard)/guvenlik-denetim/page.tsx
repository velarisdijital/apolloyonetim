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
  ShieldCheck,
  Plus,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Search,
  Filter,
  Trash2,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface GuvenlikDenetim {
  id: string;
  denetimTipi: string;
  tarih: string;
  sonrakiTarih: string | null;
  durum: string;
  denetciAdi: string | null;
  bulgular: string | null;
  fotografYolu: string | null;
  not: string | null;
  createdAt: string;
  updatedAt: string;
  buildingId: string;
}

const DENETIM_TIPI_OPTIONS = [
  { value: "Yangin Tupu", label: "Yangin Tupu" },
  { value: "Yangin Merdiveni", label: "Yangin Merdiveni" },
  { value: "Asansor", label: "Asansor" },
  { value: "Elektrik", label: "Elektrik" },
  { value: "Dogalgaz", label: "Dogalgaz" },
  { value: "Cati", label: "Cati" },
  { value: "Kacis Yolu", label: "Kacis Yolu" },
  { value: "Diger", label: "Diger" },
];

const DURUM_OPTIONS = [
  { value: "PLANLI", label: "Planli" },
  { value: "TAMAMLANDI", label: "Tamamlandi" },
  { value: "GECIKTI", label: "Gecikti" },
];

function getDurumBadgeColor(durum: string) {
  switch (durum) {
    case "PLANLI":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "TAMAMLANDI":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "GECIKTI":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

function getDurumLabel(durum: string) {
  return DURUM_OPTIONS.find((o) => o.value === durum)?.label || durum;
}

function isOverdue(sonrakiTarih: string | null): boolean {
  if (!sonrakiTarih) return false;
  return new Date(sonrakiTarih) < new Date();
}

export default function GuvenlikDenetimPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [denetimler, setDenetimler] = useState<GuvenlikDenetim[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDenetimTipi, setFilterDenetimTipi] = useState("");
  const [filterDurum, setFilterDurum] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [denetimTipi, setDenetimTipi] = useState("");
  const [tarih, setTarih] = useState("");
  const [sonrakiTarih, setSonrakiTarih] = useState("");
  const [durum, setDurum] = useState("PLANLI");
  const [denetciAdi, setDenetciAdi] = useState("");
  const [bulgular, setBulgular] = useState("");
  const [notText, setNotText] = useState("");

  const userRole = (session?.user as { rol?: string })?.rol;
  const canManage = userRole === "MASTER_ADMIN" || userRole === "KAPICI";

  const fetchDenetimler = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterDenetimTipi) params.set("denetimTipi", filterDenetimTipi);
      if (filterDurum) params.set("durum", filterDurum);
      const queryStr = params.toString();
      const res = await fetch(`/api/guvenlik-denetim${queryStr ? `?${queryStr}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setDenetimler(data);
      }
    } catch (error) {
      console.error("Denetimler yuklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, [filterDenetimTipi, filterDurum]);

  useEffect(() => {
    fetchDenetimler();
  }, [fetchDenetimler]);

  const resetForm = () => {
    setDenetimTipi("");
    setTarih("");
    setSonrakiTarih("");
    setDurum("PLANLI");
    setDenetciAdi("");
    setBulgular("");
    setNotText("");
    setEditingId(null);
  };

  const openEditDialog = (item: GuvenlikDenetim) => {
    setEditingId(item.id);
    setDenetimTipi(item.denetimTipi);
    setTarih(item.tarih ? item.tarih.split("T")[0] : "");
    setSonrakiTarih(item.sonrakiTarih ? item.sonrakiTarih.split("T")[0] : "");
    setDurum(item.durum);
    setDenetciAdi(item.denetciAdi || "");
    setBulgular(item.bulgular || "");
    setNotText(item.not || "");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!denetimTipi) {
      toast.error("Denetim tipi zorunludur");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        denetimTipi,
        tarih: tarih || undefined,
        sonrakiTarih: sonrakiTarih || undefined,
        durum,
        denetciAdi: denetciAdi.trim() || undefined,
        bulgular: bulgular.trim() || undefined,
        not: notText.trim() || undefined,
      };

      let res: Response;

      if (editingId) {
        res = await fetch(`/api/guvenlik-denetim/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/guvenlik-denetim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success(editingId ? "Denetim guncellendi" : "Denetim basariyla eklendi");
        setDialogOpen(false);
        resetForm();
        fetchDenetimler();
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
      const res = await fetch(`/api/guvenlik-denetim/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Denetim silindi");
        fetchDenetimler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Denetim silinirken hata olustu");
      }
    } catch {
      toast.error("Denetim silinirken hata olustu");
    }
  };

  const filteredDenetimler = denetimler.filter((item) =>
    item.denetimTipi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.denetciAdi && item.denetciAdi.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const tamamlananCount = denetimler.filter((d) => d.durum === "TAMAMLANDI").length;
  const geciktiCount = denetimler.filter((d) => d.durum === "GECIKTI" || isOverdue(d.sonrakiTarih)).length;

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
            Guvenlik Denetim Takibi
          </h1>
          <p className="text-muted-foreground">
            Bina guvenlik denetimlerini yonetin ve takip edin
          </p>
        </div>
        {canManage && (
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Denetim Ekle
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Denetim</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{denetimler.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tamamlananCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geciken</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{geciktiCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Denetim tipi veya denetci adina gore ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterDenetimTipi || "all"} onValueChange={(v) => setFilterDenetimTipi(v === "all" ? "" : (v || ""))}>
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Denetim Tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tum Tipler</SelectItem>
              {DENETIM_TIPI_OPTIONS.map((opt) => (
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

      {/* Denetimler Grid */}
      {filteredDenetimler.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchQuery || filterDenetimTipi || filterDurum
                ? "Sonuc bulunamadi"
                : "Henuz denetim kaydi yok"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDenetimler.map((item) => (
            <Card key={item.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    <CardTitle className="text-lg font-bold">
                      {item.denetimTipi}
                    </CardTitle>
                  </div>
                  <Badge className={getDurumBadgeColor(item.durum)}>
                    {getDurumLabel(item.durum)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Tarih: {new Date(item.tarih).toLocaleDateString("tr-TR")}</span>
                </div>
                {item.sonrakiTarih && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Sonraki: {new Date(item.sonrakiTarih).toLocaleDateString("tr-TR")}</span>
                  </div>
                )}
                {isOverdue(item.sonrakiTarih) && item.durum !== "TAMAMLANDI" && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Gecikti</span>
                  </div>
                )}
                {item.denetciAdi && (
                  <p className="text-sm text-muted-foreground">
                    Denetci: {item.denetciAdi}
                  </p>
                )}
                {item.bulgular && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Bulgular: {item.bulgular}
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
              <ShieldCheck className="h-5 w-5" />
              {editingId ? "Denetim Duzenle" : "Denetim Ekle"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Denetim Tipi *</Label>
              <Select value={denetimTipi} onValueChange={(v) => setDenetimTipi(v || "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Secin" />
                </SelectTrigger>
                <SelectContent>
                  {DENETIM_TIPI_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tarih</Label>
                <Input
                  type="date"
                  value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sonraki Tarih</Label>
                <Input
                  type="date"
                  value={sonrakiTarih}
                  onChange={(e) => setSonrakiTarih(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label>Denetci Adi</Label>
                <Input
                  placeholder="Orn: Ahmet Yilmaz"
                  value={denetciAdi}
                  onChange={(e) => setDenetciAdi(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bulgular</Label>
              <Input
                placeholder="Denetim bulgulari"
                value={bulgular}
                onChange={(e) => setBulgular(e.target.value)}
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
