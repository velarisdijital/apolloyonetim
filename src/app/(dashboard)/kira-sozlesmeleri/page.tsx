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
  FileText,
  Plus,
  Calendar,
  AlertTriangle,
  DollarSign,
  Edit,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface KiraSozlesmesi {
  id: string;
  kiracıAdSoyad: string;
  daireBilgisi: string;
  baslangicTarihi: string;
  bitisTarihi: string;
  aylikKira: string;
  depozito: string | null;
  artisOrani: string | null;
  sozlesmeYolu: string | null;
  not: string | null;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
  buildingId: string;
  apartmentId: string | null;
  apartment: { id: string; numara: string } | null;
}

function getSozlesmeDurumBadge(bitisTarihi: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bitis = new Date(bitisTarihi);
  bitis.setHours(0, 0, 0, 0);

  const diffMs = bitis.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: "Suresi Dolmus",
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
  }
  if (diffDays <= 30) {
    return {
      label: "30 gun icinde",
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
  }
  if (diffDays <= 90) {
    return {
      label: "90 gun icinde",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };
  }
  return {
    label: "Aktif",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };
}

export default function KiraSozlesmeleriPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [sozlesmeler, setSozlesmeler] = useState<KiraSozlesmesi[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [kiracıAdSoyad, setKiracıAdSoyad] = useState("");
  const [daireBilgisi, setDaireBilgisi] = useState("");
  const [baslangicTarihi, setBaslangicTarihi] = useState("");
  const [bitisTarihi, setBitisTarihi] = useState("");
  const [aylikKira, setAylikKira] = useState("");
  const [depozito, setDepozito] = useState("");
  const [artisOrani, setArtisOrani] = useState("");
  const [sozlesmeYolu, setSozlesmeYolu] = useState("");
  const [notText, setNotText] = useState("");

  const userRole = (session?.user as { rol?: string })?.rol;
  const canManage = userRole === "MASTER_ADMIN";

  const fetchSozlesmeler = useCallback(async () => {
    try {
      const res = await fetch("/api/kira-sozlesmeleri");
      if (res.ok) {
        const data = await res.json();
        setSozlesmeler(data);
      }
    } catch (error) {
      console.error("Sozlesmeler yuklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSozlesmeler();
  }, [fetchSozlesmeler]);

  const resetForm = () => {
    setKiracıAdSoyad("");
    setDaireBilgisi("");
    setBaslangicTarihi("");
    setBitisTarihi("");
    setAylikKira("");
    setDepozito("");
    setArtisOrani("");
    setSozlesmeYolu("");
    setNotText("");
    setEditingId(null);
  };

  const openEditDialog = (item: KiraSozlesmesi) => {
    setEditingId(item.id);
    setKiracıAdSoyad(item.kiracıAdSoyad);
    setDaireBilgisi(item.daireBilgisi);
    setBaslangicTarihi(item.baslangicTarihi ? item.baslangicTarihi.split("T")[0] : "");
    setBitisTarihi(item.bitisTarihi ? item.bitisTarihi.split("T")[0] : "");
    setAylikKira(item.aylikKira || "");
    setDepozito(item.depozito || "");
    setArtisOrani(item.artisOrani || "");
    setSozlesmeYolu(item.sozlesmeYolu || "");
    setNotText(item.not || "");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!kiracıAdSoyad.trim()) {
      toast.error("Kiraci adi zorunludur");
      return;
    }

    if (!daireBilgisi.trim()) {
      toast.error("Daire bilgisi zorunludur");
      return;
    }

    if (!baslangicTarihi) {
      toast.error("Baslangic tarihi zorunludur");
      return;
    }

    if (!bitisTarihi) {
      toast.error("Bitis tarihi zorunludur");
      return;
    }

    if (!aylikKira) {
      toast.error("Aylik kira zorunludur");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        kiracıAdSoyad: kiracıAdSoyad.trim(),
        daireBilgisi: daireBilgisi.trim(),
        baslangicTarihi,
        bitisTarihi,
        aylikKira,
        depozito: depozito || undefined,
        artisOrani: artisOrani || undefined,
        sozlesmeYolu: sozlesmeYolu.trim() || undefined,
        not: notText.trim() || undefined,
      };

      let res: Response;

      if (editingId) {
        res = await fetch(`/api/kira-sozlesmeleri/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/kira-sozlesmeleri", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success(editingId ? "Sozlesme guncellendi" : "Sozlesme basariyla eklendi");
        setDialogOpen(false);
        resetForm();
        fetchSozlesmeler();
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
      const res = await fetch(`/api/kira-sozlesmeleri/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Sozlesme silindi");
        fetchSozlesmeler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Sozlesme silinirken hata olustu");
      }
    } catch {
      toast.error("Sozlesme silinirken hata olustu");
    }
  };

  const filteredSozlesmeler = sozlesmeler.filter(
    (item) =>
      item.kiracıAdSoyad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.daireBilgisi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const aktifCount = sozlesmeler.filter((s) => {
    const bitis = new Date(s.bitisTarihi);
    return bitis >= new Date();
  }).length;

  const suresiYaklasanCount = sozlesmeler.filter((s) => {
    const today = new Date();
    const bitis = new Date(s.bitisTarihi);
    const diffMs = bitis.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 90;
  }).length;

  const toplamAylikKira = sozlesmeler.reduce(
    (sum, s) => sum + parseFloat(s.aylikKira || "0"),
    0
  );

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
            Kira Sozlesmesi Takibi
          </h1>
          <p className="text-muted-foreground">
            Kira sozlesmelerini yonetin ve takip edin
          </p>
        </div>
        {canManage && (
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Sozlesme Ekle
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sozlesme</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sozlesmeler.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Sozlesmeler</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aktifCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suresi Yaklasan</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suresiYaklasanCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Aylik Kira</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {toplamAylikKira.toLocaleString("tr-TR")} TL
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Kiraci adi veya daire bilgisine gore ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Sozlesmeler Grid */}
      {filteredSozlesmeler.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchQuery
                ? "Sonuc bulunamadi"
                : "Henuz sozlesme kaydi yok"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSozlesmeler.map((item) => {
            const durumBadge = getSozlesmeDurumBadge(item.bitisTarihi);
            const aylikKiraNum = parseFloat(item.aylikKira || "0");
            const artisOraniNum = item.artisOrani ? parseFloat(item.artisOrani) : null;
            const artisliKira = artisOraniNum !== null
              ? aylikKiraNum * (1 + artisOraniNum / 100)
              : null;

            return (
              <Card key={item.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <CardTitle className="text-lg font-bold">
                        {item.kiracıAdSoyad}
                      </CardTitle>
                    </div>
                    <Badge className={durumBadge.className}>
                      {durumBadge.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.daireBilgisi}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(item.baslangicTarihi).toLocaleDateString("tr-TR")} -{" "}
                    {new Date(item.bitisTarihi).toLocaleDateString("tr-TR")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Aylik Kira: {aylikKiraNum.toLocaleString("tr-TR")} TL
                  </p>
                  {item.depozito && (
                    <p className="text-sm text-muted-foreground">
                      Depozito: {parseFloat(item.depozito).toLocaleString("tr-TR")} TL
                    </p>
                  )}
                  {artisOraniNum !== null && (
                    <p className="text-sm text-muted-foreground">
                      Artis Orani: %{artisOraniNum}
                    </p>
                  )}
                  {artisliKira !== null && (
                    <p className="text-sm font-medium text-muted-foreground">
                      Artisli Kira: {artisliKira.toLocaleString("tr-TR")} TL
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
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {editingId ? "Sozlesme Duzenle" : "Sozlesme Ekle"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kiraci Adi Soyadi *</Label>
              <Input
                placeholder="Orn: Ahmet Yilmaz"
                value={kiracıAdSoyad}
                onChange={(e) => setKiracıAdSoyad(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Daire Bilgisi *</Label>
              <Input
                placeholder="Orn: Daire 3"
                value={daireBilgisi}
                onChange={(e) => setDaireBilgisi(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Baslangic Tarihi *</Label>
                <Input
                  type="date"
                  value={baslangicTarihi}
                  onChange={(e) => setBaslangicTarihi(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bitis Tarihi *</Label>
                <Input
                  type="date"
                  value={bitisTarihi}
                  onChange={(e) => setBitisTarihi(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aylik Kira (TL) *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={aylikKira}
                  onChange={(e) => setAylikKira(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Depozito (TL)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={depozito}
                  onChange={(e) => setDepozito(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Artis Orani (%)</Label>
              <Input
                type="number"
                placeholder="Orn: 25"
                value={artisOrani}
                onChange={(e) => setArtisOrani(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Sozlesme Yolu</Label>
              <Input
                placeholder="Dosya yolu veya link"
                value={sozlesmeYolu}
                onChange={(e) => setSozlesmeYolu(e.target.value)}
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
