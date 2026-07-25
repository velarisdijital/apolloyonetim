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
  MessageSquareWarning,
  Plus,
  Filter,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface Sikayet {
  id: string;
  kategori: string;
  baslik: string;
  aciklama: string;
  durum: string;
  anonim: boolean;
  yapilanIslem: string | null;
  createdAt: string;
  updatedAt: string;
  buildingId: string;
  bildirenId: string;
  bildiren: { id: string; name: string } | null;
}

const KATEGORI_OPTIONS = [
  { value: "Gurultu", label: "Gurultu" },
  { value: "Temizlik", label: "Temizlik" },
  { value: "Otopark", label: "Otopark" },
  { value: "Ortak Alan", label: "Ortak Alan" },
  { value: "Komsu", label: "Komsu" },
  { value: "Asansor", label: "Asansor" },
  { value: "Guvenlik", label: "Guvenlik" },
  { value: "Diger", label: "Diger" },
];

const DURUM_OPTIONS = [
  { value: "YENI", label: "Yeni" },
  { value: "INCELENIYOR", label: "Inceleniyor" },
  { value: "COZULDU", label: "Cozuldu" },
  { value: "REDDEDILDI", label: "Reddedildi" },
];

function getDurumBadgeColor(durum: string) {
  switch (durum) {
    case "YENI":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "INCELENIYOR":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "COZULDU":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "REDDEDILDI":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  }
}

function getDurumLabel(durum: string) {
  return DURUM_OPTIONS.find((o) => o.value === durum)?.label || durum;
}

export default function SikayetlerPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [sikayetler, setSikayetler] = useState<Sikayet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterDurum, setFilterDurum] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state - new complaint
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [kategori, setKategori] = useState("");
  const [anonim, setAnonim] = useState(false);

  // Form state - update complaint
  const [updateDurum, setUpdateDurum] = useState("");
  const [yapilanIslem, setYapilanIslem] = useState("");

  const userRole = (session?.user as { rol?: string })?.rol;
  const userId = (session?.user as { id?: string })?.id;
  const isAdmin = userRole === "MASTER_ADMIN";

  const fetchSikayetler = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterDurum) params.set("durum", filterDurum);
      const queryStr = params.toString();
      const res = await fetch(`/api/sikayetler${queryStr ? `?${queryStr}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setSikayetler(data);
      }
    } catch (error) {
      console.error("Sikayetler yuklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, [filterDurum]);

  useEffect(() => {
    fetchSikayetler();
  }, [fetchSikayetler]);

  const resetForm = () => {
    setBaslik("");
    setAciklama("");
    setKategori("");
    setAnonim(false);
  };

  const handleSubmit = async () => {
    if (!baslik.trim()) {
      toast.error("Baslik zorunludur");
      return;
    }

    if (!aciklama.trim()) {
      toast.error("Aciklama zorunludur");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sikayetler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baslik: baslik.trim(),
          aciklama: aciklama.trim(),
          kategori: kategori || "Diger",
          anonim,
        }),
      });

      if (res.ok) {
        toast.success("Sikayet/oneri basariyla gonderildi");
        setDialogOpen(false);
        resetForm();
        fetchSikayetler();
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

  const openUpdateDialog = (item: Sikayet) => {
    setUpdatingId(item.id);
    setUpdateDurum(item.durum);
    setYapilanIslem(item.yapilanIslem || "");
    setUpdateDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!updatingId) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/sikayetler/${updatingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durum: updateDurum,
          yapilanIslem: yapilanIslem.trim() || null,
        }),
      });

      if (res.ok) {
        toast.success("Sikayet guncellendi");
        setUpdateDialogOpen(false);
        setUpdatingId(null);
        fetchSikayetler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Guncelleme sirasinda hata olustu");
      }
    } catch {
      toast.error("Guncelleme sirasinda hata olustu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/sikayetler/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Sikayet silindi");
        fetchSikayetler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Sikayet silinirken hata olustu");
      }
    } catch {
      toast.error("Sikayet silinirken hata olustu");
    }
  };

  const toplamCount = sikayetler.length;
  const yeniCount = sikayetler.filter((s) => s.durum === "YENI").length;
  const cozulenCount = sikayetler.filter((s) => s.durum === "COZULDU").length;

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
            Sikayet / Oneri Sistemi
          </h1>
          <p className="text-muted-foreground">
            Sikayet ve onerilerinizi iletin, takip edin
          </p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Bildirim
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam</CardTitle>
            <MessageSquareWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toplamCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yeni</CardTitle>
            <MessageSquareWarning className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yeniCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cozulen</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cozulenCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <Select value={filterDurum || "all"} onValueChange={(v) => setFilterDurum(v === "all" ? "" : (v || ""))}>
            <SelectTrigger className="w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Durum Filtresi" />
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

      {/* Sikayetler List */}
      {sikayetler.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquareWarning className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {filterDurum
                ? "Sonuc bulunamadi"
                : "Henuz sikayet veya oneri yok"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sikayetler.map((item) => (
            <Card key={item.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquareWarning className="h-5 w-5 shrink-0" />
                    <CardTitle className="text-lg font-bold truncate">
                      {item.baslik}
                    </CardTitle>
                  </div>
                  <Badge className={getDurumBadgeColor(item.durum)}>
                    {getDurumLabel(item.durum)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{item.kategori}</Badge>
                  {item.anonim && (
                    <Badge variant="secondary">Anonim</Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3">
                  {item.aciklama}
                </p>

                {item.bildiren && (
                  <p className="text-sm text-muted-foreground">
                    Bildiren: {item.bildiren.name}
                  </p>
                )}

                {item.yapilanIslem && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Yapilan Islem:</p>
                    <p className="text-sm">{item.yapilanIslem}</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                </p>

                <div className="pt-2 border-t flex items-center justify-end gap-1">
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openUpdateDialog(item)}
                    >
                      Durumu Guncelle
                    </Button>
                  )}
                  {(isAdmin || item.bildirenId === userId) && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(item.id)}
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

      {/* New Complaint Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareWarning className="h-5 w-5" />
              Yeni Sikayet / Oneri
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Baslik *</Label>
              <Input
                placeholder="Sikayet veya onerinizin basligi"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Aciklama *</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Detayli aciklama yazin..."
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={kategori} onValueChange={(v) => setKategori(v || "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kategori secin" />
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={anonim}
                onClick={() => setAnonim(!anonim)}
                className={`h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  anonim ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {anonim && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
              <Label className="cursor-pointer" onClick={() => setAnonim(!anonim)}>
                Anonim olarak gonder
              </Label>
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
                ? (t.common?.saving || "Gonderiliyor...")
                : "Gonder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog (Admin) */}
      <Dialog open={updateDialogOpen} onOpenChange={(open) => { if (!open) { setUpdateDialogOpen(false); setUpdatingId(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Durum Guncelle
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Durum</Label>
              <Select value={updateDurum} onValueChange={(v) => setUpdateDurum(v || "")}>
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
              <Label>Yapilan Islem</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Yapilan islem veya cevap..."
                value={yapilanIslem}
                onChange={(e) => setYapilanIslem(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setUpdateDialogOpen(false); setUpdatingId(null); }}
            >
              {t.common?.cancel || "Iptal"}
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
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
