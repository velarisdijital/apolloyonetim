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
  Wrench,
  Calendar,
  Plus,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface PeriyodikBakim {
  id: string;
  baslik: string;
  aciklama: string | null;
  periyotGun: number;
  sonBakimTarihi: string | null;
  sonrakiBakimTarihi: string | null;
  durum: string;
  maliyet: string | null;
  bakimYapan: string | null;
  bakimNotu: string | null;
  createdAt: string;
  updatedAt: string;
  buildingId: string;
  demirbasId: string | null;
  demirbas: { ad: string; kategori: string } | null;
}

function getDurumBadge(durum: string) {
  switch (durum) {
    case "PLANLI":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Planlı</Badge>;
    case "DEVAM_EDIYOR":
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Devam Ediyor</Badge>;
    case "TAMAMLANDI":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Tamamlandı</Badge>;
    case "ERTELENDI":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Ertelendi</Badge>;
    default:
      return <Badge>{durum}</Badge>;
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("tr-TR");
}

function isOverdue(bakim: PeriyodikBakim) {
  if (!bakim.sonrakiBakimTarihi || bakim.durum === "TAMAMLANDI") return false;
  return new Date(bakim.sonrakiBakimTarihi) < new Date();
}

function isUpcoming(bakim: PeriyodikBakim) {
  if (!bakim.sonrakiBakimTarihi || bakim.durum === "TAMAMLANDI") return false;
  const next = new Date(bakim.sonrakiBakimTarihi);
  const now = new Date();
  const sevenDays = new Date(now);
  sevenDays.setDate(sevenDays.getDate() + 7);
  return next >= now && next <= sevenDays;
}

export default function BakimPlanlamaPage() {
  const { data: session } = useSession();
  const { t: _t } = useTranslation();
  void _t;
  const [bakimlar, setBakimlar] = useState<PeriyodikBakim[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedBakim, setSelectedBakim] = useState<PeriyodikBakim | null>(null);
  const [filterDurum, setFilterDurum] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Add form state
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [periyotGun, setPeriyotGun] = useState("");
  const [sonBakimTarihi, setSonBakimTarihi] = useState("");

  // Complete form state
  const [completeDurum, setCompleteDurum] = useState("TAMAMLANDI");
  const [maliyet, setMaliyet] = useState("");
  const [bakimYapan, setBakimYapan] = useState("");
  const [bakimNotu, setBakimNotu] = useState("");

  const userRole = (session?.user as { rol?: string })?.rol;
  const canEdit = userRole === "MASTER_ADMIN" || userRole === "KAPICI";

  const fetchBakimlar = useCallback(async () => {
    try {
      const url = filterDurum
        ? `/api/bakim-planlama?durum=${filterDurum}`
        : "/api/bakim-planlama";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBakimlar(data);
      }
    } catch (error) {
      console.error("Bakimlar yuklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, [filterDurum]);

  useEffect(() => {
    fetchBakimlar();
  }, [fetchBakimlar]);

  const resetForm = () => {
    setBaslik("");
    setAciklama("");
    setPeriyotGun("");
    setSonBakimTarihi("");
  };

  const resetCompleteForm = () => {
    setCompleteDurum("TAMAMLANDI");
    setMaliyet("");
    setBakimYapan("");
    setBakimNotu("");
    setSelectedBakim(null);
  };

  const handleSubmit = async () => {
    if (!baslik.trim()) {
      toast.error("Başlık zorunludur");
      return;
    }
    if (!periyotGun || parseInt(periyotGun) < 1) {
      toast.error("Periyot gün geçerli olmalıdır");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bakim-planlama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baslik: baslik.trim(),
          aciklama: aciklama.trim() || undefined,
          periyotGun: parseInt(periyotGun),
          sonBakimTarihi: sonBakimTarihi || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Bakım planı başarıyla eklendi");
        setDialogOpen(false);
        resetForm();
        fetchBakimlar();
      } else {
        const data = await res.json();
        toast.error(data.error || "Bakım planı eklenirken hata oluştu");
      }
    } catch {
      toast.error("Bakım planı eklenirken hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedBakim) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/bakim-planlama/${selectedBakim.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durum: completeDurum,
          maliyet: maliyet || undefined,
          bakimYapan: bakimYapan.trim() || undefined,
          bakimNotu: bakimNotu.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Bakım durumu güncellendi");
        setCompleteDialogOpen(false);
        resetCompleteForm();
        fetchBakimlar();
      } else {
        const data = await res.json();
        toast.error(data.error || "Bakım güncellenirken hata oluştu");
      }
    } catch {
      toast.error("Bakım güncellenirken hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/bakim-planlama/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Bakım planı silindi");
        fetchBakimlar();
      } else {
        const data = await res.json();
        toast.error(data.error || "Bakım planı silinirken hata oluştu");
      }
    } catch {
      toast.error("Bakım planı silinirken hata oluştu");
    }
  };

  const openCompleteDialog = (bakim: PeriyodikBakim) => {
    setSelectedBakim(bakim);
    setCompleteDurum(bakim.durum === "TAMAMLANDI" ? "TAMAMLANDI" : "TAMAMLANDI");
    setMaliyet(bakim.maliyet || "");
    setBakimYapan(bakim.bakimYapan || "");
    setBakimNotu(bakim.bakimNotu || "");
    setCompleteDialogOpen(true);
  };

  // Stats
  const totalBakimlar = bakimlar.length;
  const gecikenBakimlar = bakimlar.filter(isOverdue).length;
  const yaklasanBakimlar = bakimlar.filter(isUpcoming).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Periyodik Bakım Planlama</h1>
          <p className="text-muted-foreground">Bakım planlarını yönetin ve takip edin</p>
        </div>
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Bakım Planı
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Bakım</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBakimlar}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geciken</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{gecikenBakimlar}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yaklaşan (7 gün)</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{yaklasanBakimlar}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="w-[200px]">
          <Select value={filterDurum} onValueChange={(v) => setFilterDurum(v || "")}>
            <SelectTrigger>
              <SelectValue placeholder="Tüm Durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="PLANLI">Planlı</SelectItem>
              <SelectItem value="DEVAM_EDIYOR">Devam Ediyor</SelectItem>
              <SelectItem value="TAMAMLANDI">Tamamlandı</SelectItem>
              <SelectItem value="ERTELENDI">Ertelendi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Maintenance Cards Grid */}
      {bakimlar.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">Henüz bakım planı bulunmuyor</p>
            {canEdit && (
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                İlk Bakım Planını Ekle
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bakimlar.map((bakim) => {
            const overdue = isOverdue(bakim);
            const upcoming = isUpcoming(bakim);
            let borderClass = "";
            if (overdue) borderClass = "border-red-500 border-2";
            else if (upcoming) borderClass = "border-yellow-500 border-2";

            return (
              <Card key={bakim.id} className={borderClass}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-semibold">{bakim.baslik}</CardTitle>
                    {getDurumBadge(bakim.durum)}
                  </div>
                  {bakim.aciklama && (
                    <p className="text-sm text-muted-foreground mt-1">{bakim.aciklama}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Periyot: {bakim.periyotGun} gün</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Sonraki Bakım:{" "}
                      <span className={overdue ? "text-red-600 font-semibold" : upcoming ? "text-yellow-600 font-semibold" : ""}>
                        {formatDate(bakim.sonrakiBakimTarihi)}
                      </span>
                    </span>
                  </div>

                  {bakim.sonBakimTarihi && (
                    <div className="text-sm text-muted-foreground">
                      Son Bakım: {formatDate(bakim.sonBakimTarihi)}
                    </div>
                  )}

                  {bakim.maliyet && (
                    <div className="text-sm">
                      Maliyet: <span className="font-medium">{parseFloat(bakim.maliyet).toLocaleString("tr-TR")} TL</span>
                    </div>
                  )}

                  {bakim.demirbas && (
                    <div className="text-sm text-muted-foreground">
                      Demirbaş: {bakim.demirbas.ad}
                    </div>
                  )}

                  {bakim.bakimYapan && (
                    <div className="text-sm text-muted-foreground">
                      Bakımı Yapan: {bakim.bakimYapan}
                    </div>
                  )}

                  {overdue && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Gecikmiş bakım!</span>
                    </div>
                  )}

                  {canEdit && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCompleteDialog(bakim)}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Güncelle
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(bakim.id)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Sil
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Bakım Planı</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baslik">Başlık *</Label>
              <Input
                id="baslik"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                placeholder="Bakım başlığı"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aciklama">Açıklama</Label>
              <Textarea
                id="aciklama"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="Bakım açıklaması"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periyotGun">Periyot (Gün) *</Label>
              <Input
                id="periyotGun"
                type="number"
                min="1"
                value={periyotGun}
                onChange={(e) => setPeriyotGun(e.target.value)}
                placeholder="Örn: 30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sonBakimTarihi">Son Bakım Tarihi (Opsiyonel)</Label>
              <Input
                id="sonBakimTarihi"
                type="date"
                value={sonBakimTarihi}
                onChange={(e) => setSonBakimTarihi(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              İptal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Ekleniyor..." : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete/Update Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={(open) => { setCompleteDialogOpen(open); if (!open) resetCompleteForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bakım Durumunu Güncelle</DialogTitle>
          </DialogHeader>
          {selectedBakim && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <strong>{selectedBakim.baslik}</strong> bakımını güncelliyorsunuz.
              </p>
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select value={completeDurum} onValueChange={(v) => setCompleteDurum(v || "")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANLI">Planlı</SelectItem>
                    <SelectItem value="DEVAM_EDIYOR">Devam Ediyor</SelectItem>
                    <SelectItem value="TAMAMLANDI">Tamamlandı</SelectItem>
                    <SelectItem value="ERTELENDI">Ertelendi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maliyet">Maliyet (TL)</Label>
                <Input
                  id="maliyet"
                  type="number"
                  step="0.01"
                  min="0"
                  value={maliyet}
                  onChange={(e) => setMaliyet(e.target.value)}
                  placeholder="Örn: 1500.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bakimYapan">Bakımı Yapan</Label>
                <Input
                  id="bakimYapan"
                  value={bakimYapan}
                  onChange={(e) => setBakimYapan(e.target.value)}
                  placeholder="Bakımı yapan kişi/firma"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bakimNotu">Bakım Notu</Label>
                <Textarea
                  id="bakimNotu"
                  value={bakimNotu}
                  onChange={(e) => setBakimNotu(e.target.value)}
                  placeholder="Bakım ile ilgili notlar"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCompleteDialogOpen(false); resetCompleteForm(); }}>
              İptal
            </Button>
            <Button onClick={handleComplete} disabled={submitting}>
              {submitting ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
