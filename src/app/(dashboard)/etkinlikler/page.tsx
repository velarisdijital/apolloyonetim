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
  Calendar,
  MapPin,
  Users,
  Plus,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface EtkinlikKatilim {
  id: string;
  durum: string;
  userId: string;
  user: { id: string; ad: string; soyad: string };
}

interface Etkinlik {
  id: string;
  baslik: string;
  aciklama: string | null;
  tarih: string;
  bitisTarihi: string | null;
  konum: string | null;
  kapasite: number | null;
  aktif: boolean;
  katilimlar: EtkinlikKatilim[];
  katilimciSayisi: number;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}



export default function EtkinliklerPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [etkinlikler, setEtkinlikler] = useState<Etkinlik[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Form state
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [tarih, setTarih] = useState("");
  const [bitisTarihi, setBitisTarihi] = useState("");
  const [konum, setKonum] = useState("");
  const [kapasite, setKapasite] = useState("");

  const userRole = (session?.user as { rol?: string })?.rol;
  const userId = (session?.user as { id?: string })?.id;

  const fetchEtkinlikler = useCallback(async () => {
    try {
      const res = await fetch("/api/etkinlikler");
      if (res.ok) {
        const data = await res.json();
        setEtkinlikler(data);
      }
    } catch (error) {
      console.error("Etkinlikler yuklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEtkinlikler();
  }, [fetchEtkinlikler]);

  const resetForm = () => {
    setBaslik("");
    setAciklama("");
    setTarih("");
    setBitisTarihi("");
    setKonum("");
    setKapasite("");
  };

  const handleSubmit = async () => {
    if (!baslik.trim()) {
      toast.error("Baslik zorunludur");
      return;
    }
    if (!tarih) {
      toast.error("Tarih zorunludur");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/etkinlikler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baslik: baslik.trim(),
          aciklama: aciklama.trim() || undefined,
          tarih,
          bitisTarihi: bitisTarihi || undefined,
          konum: konum.trim() || undefined,
          kapasite: kapasite ? parseInt(kapasite, 10) : undefined,
        }),
      });

      if (res.ok) {
        toast.success("Etkinlik basariyla olusturuldu");
        setDialogOpen(false);
        resetForm();
        fetchEtkinlikler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Etkinlik olusturulurken hata olustu");
      }
    } catch {
      toast.error("Etkinlik olusturulurken hata olustu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/etkinlikler/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Etkinlik silindi");
        fetchEtkinlikler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Etkinlik silinirken hata olustu");
      }
    } catch {
      toast.error("Etkinlik silinirken hata olustu");
    }
  };

  const handleKatil = async (etkinlikId: string) => {
    setJoiningId(etkinlikId);
    try {
      const res = await fetch(`/api/etkinlikler/${etkinlikId}/katil`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.action === "joined") {
          toast.success("Etkinlige katildiniz");
        } else {
          toast.success("Etkinlikten ayrildiniz");
        }
        fetchEtkinlikler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Islem sirasinda hata olustu");
      }
    } catch {
      toast.error("Islem sirasinda hata olustu");
    } finally {
      setJoiningId(null);
    }
  };

  const now = new Date();
  const upcomingEvents = etkinlikler.filter((e) => new Date(e.tarih) >= now);
  const pastEvents = etkinlikler.filter((e) => new Date(e.tarih) < now).reverse();

  const isUserJoined = (etkinlik: Etkinlik) => {
    return etkinlik.katilimlar.some((k) => k.userId === userId);
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
          <h1 className="text-3xl font-bold tracking-tight">Etkinlikler</h1>
          <p className="text-muted-foreground">
            Bina etkinliklerini goruntuleyin ve katilim saglayin
          </p>
        </div>
        {userRole === "MASTER_ADMIN" && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Etkinlik Olustur
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Yaklasan Etkinlikler
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Etkinlik
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{etkinlikler.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Katildiklarim
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {etkinlikler.filter((e) => isUserJoined(e)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Yaklasan etkinlik bulunmuyor
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.map((etkinlik) => {
            const joined = isUserJoined(etkinlik);
            const isFull =
              etkinlik.kapasite !== null &&
              etkinlik.katilimciSayisi >= etkinlik.kapasite;

            return (
              <Card key={etkinlik.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{etkinlik.baslik}</CardTitle>
                    <div className="flex items-center gap-1">
                      {joined && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Katiliyorsunuz
                        </Badge>
                      )}
                      {userRole === "MASTER_ADMIN" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(etkinlik.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {etkinlik.aciklama && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {etkinlik.aciklama}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(etkinlik.tarih)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatTime(etkinlik.tarih)}
                        {etkinlik.bitisTarihi &&
                          ` - ${formatTime(etkinlik.bitisTarihi)}`}
                      </span>
                    </div>
                    {etkinlik.konum && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{etkinlik.konum}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {etkinlik.katilimciSayisi}
                        {etkinlik.kapasite !== null
                          ? ` / ${etkinlik.kapasite} kisi`
                          : " katilimci"}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  {etkinlik.kapasite !== null && (
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isFull
                            ? "bg-red-500"
                            : etkinlik.katilimciSayisi / etkinlik.kapasite > 0.7
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            (etkinlik.katilimciSayisi / etkinlik.kapasite) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <Button
                      variant={joined ? "outline" : "default"}
                      size="sm"
                      className="w-full"
                      disabled={joiningId === etkinlik.id || (!joined && isFull)}
                      onClick={() => handleKatil(etkinlik.id)}
                    >
                      {joined ? (
                        <>
                          <UserMinus className="mr-2 h-4 w-4" />
                          Ayril
                        </>
                      ) : isFull ? (
                        "Kapasite Dolu"
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Katil
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPast ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Gecmis Etkinlikler ({pastEvents.length})
          </button>

          {showPast && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((etkinlik) => (
                <Card key={etkinlik.id} className="relative opacity-70">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        {etkinlik.baslik}
                      </CardTitle>
                      <Badge variant="secondary">Gecmis</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {etkinlik.aciklama && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {etkinlik.aciklama}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(etkinlik.tarih)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatTime(etkinlik.tarih)}</span>
                    </div>
                    {etkinlik.konum && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{etkinlik.konum}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{etkinlik.katilimciSayisi} katilimci</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Event Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Yeni Etkinlik Olustur
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Baslik *</Label>
              <Input
                placeholder="Etkinlik basligi"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Aciklama</Label>
              <Textarea
                placeholder="Etkinlik hakkinda detaylar..."
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Baslangic Tarihi *</Label>
                <Input
                  type="datetime-local"
                  value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bitis Tarihi</Label>
                <Input
                  type="datetime-local"
                  value={bitisTarihi}
                  onChange={(e) => setBitisTarihi(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Konum</Label>
                <Input
                  placeholder="Ortak alan, bahce..."
                  value={konum}
                  onChange={(e) => setKonum(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kapasite</Label>
                <Input
                  type="number"
                  placeholder="Sinir yok"
                  value={kapasite}
                  onChange={(e) => setKapasite(e.target.value)}
                  min="1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              {t.common?.cancel || "Iptal"}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (t.common?.saving || "Kaydediliyor...") : "Olustur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
