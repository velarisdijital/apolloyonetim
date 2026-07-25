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
  ClipboardList,
  Plus,
  User,
  Calendar,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface GorevUser {
  ad: string;
  soyad: string;
}

interface Gorev {
  id: string;
  baslik: string;
  aciklama: string | null;
  oncelik: string;
  durum: string;
  sonTarih: string | null;
  tamamlanmaTarihi: string | null;
  tamamlanmaNotu: string | null;
  createdAt: string;
  olusturanId: string;
  atananId: string | null;
  olusturan: GorevUser;
  atanan: GorevUser | null;
}

interface KullaniciOption {
  id: string;
  ad: string;
  soyad: string;
}

const ONCELIK_OPTIONS = [
  { value: "DUSUK", label: "Dusuk" },
  { value: "NORMAL", label: "Normal" },
  { value: "YUKSEK", label: "Yuksek" },
  { value: "ACIL", label: "Acil" },
];

const DURUM_OPTIONS = [
  { value: "BEKLEMEDE", label: "Beklemede" },
  { value: "DEVAM_EDIYOR", label: "Devam Ediyor" },
  { value: "TAMAMLANDI", label: "Tamamlandi" },
  { value: "IPTAL", label: "Iptal" },
];

function getOncelikBadgeColor(oncelik: string) {
  switch (oncelik) {
    case "ACIL":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "YUKSEK":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "NORMAL":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "DUSUK":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
}

function getDurumBadgeColor(durum: string) {
  switch (durum) {
    case "BEKLEMEDE":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "DEVAM_EDIYOR":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "TAMAMLANDI":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "IPTAL":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
}

function getDurumIcon(durum: string) {
  switch (durum) {
    case "BEKLEMEDE":
      return <Clock className="h-4 w-4" />;
    case "DEVAM_EDIYOR":
      return <PlayCircle className="h-4 w-4" />;
    case "TAMAMLANDI":
      return <CheckCircle2 className="h-4 w-4" />;
    case "IPTAL":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

function isOverdue(sonTarih: string | null, durum: string): boolean {
  if (!sonTarih || durum === "TAMAMLANDI" || durum === "IPTAL") return false;
  return new Date(sonTarih) < new Date();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("tr-TR");
}

export default function GorevlerPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [kullanicilar, setKullanicilar] = useState<KullaniciOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completingGorev, setCompletingGorev] = useState<Gorev | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterDurum, setFilterDurum] = useState("");
  const [filterOncelik, setFilterOncelik] = useState("");

  // Form state
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [oncelik, setOncelik] = useState("NORMAL");
  const [sonTarih, setSonTarih] = useState("");
  const [atananId, setAtananId] = useState("");

  // Complete form
  const [tamamlanmaNotu, setTamamlanmaNotu] = useState("");

  const userRole = (session?.user as { rol?: string })?.rol;

  const canManage = userRole === "MASTER_ADMIN" || userRole === "KAPICI";

  const fetchGorevler = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterDurum) params.set("durum", filterDurum);
      if (filterOncelik) params.set("oncelik", filterOncelik);

      const res = await fetch(`/api/gorevler?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setGorevler(data);
      }
    } catch (error) {
      console.error("Gorevler yuklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, [filterDurum, filterOncelik]);

  const fetchKullanicilar = useCallback(async () => {
    try {
      const res = await fetch("/api/kullanicilar");
      if (res.ok) {
        const data = await res.json();
        setKullanicilar(data);
      }
    } catch (error) {
      console.error("Kullanicilar yuklenirken hata:", error);
    }
  }, []);

  useEffect(() => {
    fetchGorevler();
  }, [fetchGorevler]);

  useEffect(() => {
    fetchKullanicilar();
  }, [fetchKullanicilar]);

  const resetForm = () => {
    setBaslik("");
    setAciklama("");
    setOncelik("NORMAL");
    setSonTarih("");
    setAtananId("");
  };

  const handleSubmit = async () => {
    if (!baslik.trim()) {
      toast.error("Baslik zorunludur");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/gorevler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baslik: baslik.trim(),
          aciklama: aciklama.trim() || undefined,
          oncelik,
          sonTarih: sonTarih || undefined,
          atananId: atananId || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Gorev basariyla olusturuldu");
        setDialogOpen(false);
        resetForm();
        fetchGorevler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gorev olusturulurken hata olustu");
      }
    } catch {
      toast.error("Gorev olusturulurken hata olustu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (gorev: Gorev, newDurum: string) => {
    if (newDurum === "TAMAMLANDI") {
      setCompletingGorev(gorev);
      setTamamlanmaNotu("");
      setCompleteDialogOpen(true);
      return;
    }

    try {
      const res = await fetch(`/api/gorevler/${gorev.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durum: newDurum }),
      });

      if (res.ok) {
        toast.success("Gorev durumu guncellendi");
        fetchGorevler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Durum guncellenirken hata olustu");
      }
    } catch {
      toast.error("Durum guncellenirken hata olustu");
    }
  };

  const handleComplete = async () => {
    if (!completingGorev) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/gorevler/${completingGorev.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durum: "TAMAMLANDI",
          tamamlanmaNotu: tamamlanmaNotu.trim() || null,
        }),
      });

      if (res.ok) {
        toast.success("Gorev tamamlandi");
        setCompleteDialogOpen(false);
        setCompletingGorev(null);
        setTamamlanmaNotu("");
        fetchGorevler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gorev tamamlanirken hata olustu");
      }
    } catch {
      toast.error("Gorev tamamlanirken hata olustu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/gorevler/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Gorev silindi");
        fetchGorevler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gorev silinirken hata olustu");
      }
    } catch {
      toast.error("Gorev silinirken hata olustu");
    }
  };

  // Group tasks by status for kanban-style view
  const groupedGorevler = {
    BEKLEMEDE: gorevler.filter((g) => g.durum === "BEKLEMEDE"),
    DEVAM_EDIYOR: gorevler.filter((g) => g.durum === "DEVAM_EDIYOR"),
    TAMAMLANDI: gorevler.filter((g) => g.durum === "TAMAMLANDI"),
    IPTAL: gorevler.filter((g) => g.durum === "IPTAL"),
  };

  const durumStats = {
    beklemede: groupedGorevler.BEKLEMEDE.length,
    devamEdiyor: groupedGorevler.DEVAM_EDIYOR.length,
    tamamlandi: groupedGorevler.TAMAMLANDI.length,
    iptal: groupedGorevler.IPTAL.length,
  };

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
            Gorev Yonetimi
          </h1>
          <p className="text-muted-foreground">
            Is ve gorev atamalarini yonetin
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Gorev
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beklemede</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{durumStats.beklemede}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devam Ediyor</CardTitle>
            <PlayCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{durumStats.devamEdiyor}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlandi</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{durumStats.tamamlandi}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Iptal</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{durumStats.iptal}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="w-48">
          <Select value={filterDurum || "all"} onValueChange={(v) => setFilterDurum(v === "all" ? "" : (v || ""))}>
            <SelectTrigger>
              <SelectValue placeholder="Tum Durumlar" />
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
        <div className="w-48">
          <Select value={filterOncelik || "all"} onValueChange={(v) => setFilterOncelik(v === "all" ? "" : (v || ""))}>
            <SelectTrigger>
              <SelectValue placeholder="Tum Oncelikler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tum Oncelikler</SelectItem>
              {ONCELIK_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban-style columns */}
      {filterDurum && filterDurum !== "all" ? (
        // Filtered: show as flat list
        <div>
          {gorevler.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Bu filtreye uygun gorev bulunamadi
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {gorevler.map((gorev) => (
                <GorevCard
                  key={gorev.id}
                  gorev={gorev}
                  canManage={canManage}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        // No durum filter: show kanban columns
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {DURUM_OPTIONS.map((durumOpt) => {
            const columnGorevler = groupedGorevler[durumOpt.value as keyof typeof groupedGorevler] || [];
            return (
              <div key={durumOpt.value} className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  {getDurumIcon(durumOpt.value)}
                  <h3 className="font-semibold">{durumOpt.label}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {columnGorevler.length}
                  </Badge>
                </div>
                {columnGorevler.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Gorev yok
                  </p>
                ) : (
                  <div className="space-y-3">
                    {columnGorevler.map((gorev) => (
                      <GorevCard
                        key={gorev.id}
                        gorev={gorev}
                        canManage={canManage}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        compact
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Yeni Gorev Olustur
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Baslik *</Label>
              <Input
                placeholder="Gorev basligi"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Aciklama</Label>
              <Textarea
                placeholder="Gorev aciklamasi..."
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Oncelik</Label>
                <Select value={oncelik} onValueChange={(v) => setOncelik(v || "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ONCELIK_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Son Tarih</Label>
                <Input
                  type="date"
                  value={sonTarih}
                  onChange={(e) => setSonTarih(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Atanan Kisi</Label>
              <Select value={atananId || "none"} onValueChange={(v) => setAtananId(v === "none" ? "" : (v || ""))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kisi secin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Atanmamis</SelectItem>
                  {kullanicilar.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.ad} {k.soyad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {submitting ? (t.common?.saving || "Kaydediliyor...") : "Olustur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Task Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={(open) => { if (!open) { setCompleteDialogOpen(false); setCompletingGorev(null); setTamamlanmaNotu(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Gorevi Tamamla
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {completingGorev && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{completingGorev.baslik}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Tamamlanma Notu (opsiyonel)</Label>
              <Textarea
                placeholder="Gorev hakkinda not ekleyin..."
                value={tamamlanmaNotu}
                onChange={(e) => setTamamlanmaNotu(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setCompleteDialogOpen(false); setCompletingGorev(null); setTamamlanmaNotu(""); }}
            >
              {t.common?.cancel || "Iptal"}
            </Button>
            <Button onClick={handleComplete} disabled={submitting} className="bg-green-600 hover:bg-green-700">
              {submitting ? "Tamamlaniyor..." : "Tamamla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Separate card component for reuse
function GorevCard({
  gorev,
  canManage,
  onStatusChange,
  onDelete,
  compact = false,
}: {
  gorev: Gorev;
  canManage: boolean;
  onStatusChange: (gorev: Gorev, newDurum: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  const overdue = isOverdue(gorev.sonTarih, gorev.durum);

  return (
    <Card className={`relative ${overdue ? "border-red-300 dark:border-red-700" : ""}`}>
      <CardHeader className={compact ? "pb-2 pt-4 px-4" : "pb-3"}>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className={compact ? "text-sm font-semibold leading-tight" : "text-base font-semibold"}>
            {gorev.baslik}
          </CardTitle>
          <div className="flex items-center gap-1 shrink-0">
            <Badge className={getOncelikBadgeColor(gorev.oncelik)}>
              {gorev.oncelik === "ACIL" && <AlertTriangle className="h-3 w-3 mr-1" />}
              {ONCELIK_OPTIONS.find((o) => o.value === gorev.oncelik)?.label || gorev.oncelik}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? "pb-4 px-4 space-y-2" : "space-y-3"}>
        {!compact && gorev.aciklama && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {gorev.aciklama}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Badge className={getDurumBadgeColor(gorev.durum)}>
            {getDurumIcon(gorev.durum)}
            <span className="ml-1">
              {DURUM_OPTIONS.find((o) => o.value === gorev.durum)?.label || gorev.durum}
            </span>
          </Badge>
        </div>

        {gorev.sonTarih && (
          <div className={`flex items-center gap-1 text-sm ${overdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}`}>
            <Calendar className="h-3.5 w-3.5" />
            <span>Son: {formatDate(gorev.sonTarih)}</span>
            {overdue && <AlertTriangle className="h-3.5 w-3.5 ml-1" />}
          </div>
        )}

        {gorev.atanan && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span>{gorev.atanan.ad} {gorev.atanan.soyad}</span>
          </div>
        )}

        {gorev.tamamlanmaNotu && gorev.durum === "TAMAMLANDI" && (
          <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950 p-2 rounded">
            <span className="font-medium">Not:</span> {gorev.tamamlanmaNotu}
          </div>
        )}

        {!compact && (
          <div className="text-xs text-muted-foreground">
            Olusturan: {gorev.olusturan.ad} {gorev.olusturan.soyad}
          </div>
        )}

        {canManage && gorev.durum !== "TAMAMLANDI" && gorev.durum !== "IPTAL" && (
          <div className="flex items-center gap-1 pt-2 border-t">
            {gorev.durum === "BEKLEMEDE" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange(gorev, "DEVAM_EDIYOR")}
                className="text-blue-600 hover:text-blue-700 h-7 text-xs"
              >
                <PlayCircle className="h-3.5 w-3.5 mr-1" />
                Basla
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(gorev, "TAMAMLANDI")}
              className="text-green-600 hover:text-green-700 h-7 text-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Tamamla
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(gorev, "IPTAL")}
              className="text-gray-500 hover:text-gray-600 h-7 text-xs"
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Iptal
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(gorev.id)}
              className="text-destructive hover:text-destructive ml-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
