"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wrench, Plus, MapPin, User, Clock } from "lucide-react";
import { toast } from "sonner";

interface ArizaBildirimi {
  id: string;
  baslik: string;
  aciklama: string;
  konum: string;
  durum: "BEKLEMEDE" | "INCELENIYOR" | "TAMAMLANDI";
  yanit: string | null;
  createdAt: string;
  user: { ad: string; soyad: string };
}

const DURUM_LABELS: Record<string, string> = {
  BEKLEMEDE: "Beklemede",
  INCELENIYOR: "İnceleniyor",
  TAMAMLANDI: "Tamamlandı",
};

const DURUM_COLORS: Record<string, string> = {
  BEKLEMEDE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  INCELENIYOR: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  TAMAMLANDI: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default function ArizalarPage() {
  const { data: session } = useSession();
  const [arizalar, setArizalar] = useState<ArizaBildirimi[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [konum, setKonum] = useState("");

  const isYoneticiOrKapici =
    session?.user?.rol === "MASTER_ADMIN" || session?.user?.rol === "KAPICI";

  const fetchArizalar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/arizalar");
      if (res.ok) {
        setArizalar(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArizalar();
  }, [fetchArizalar]);

  const handleCreate = async () => {
    if (!baslik || !aciklama || !konum) {
      toast.error("Tüm alanlar doldurulmalıdır");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/arizalar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baslik, aciklama, konum }),
      });

      if (!res.ok) {
        throw new Error("Arıza bildirimi oluşturulamadı");
      }

      toast.success("Arıza bildirimi oluşturuldu");
      setDialogOpen(false);
      setBaslik("");
      setAciklama("");
      setKonum("");
      await fetchArizalar();
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDurum = async (id: string, durum: string) => {
    try {
      const res = await fetch(`/api/arizalar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durum }),
      });

      if (res.ok) {
        toast.success("Durum güncellendi");
        await fetchArizalar();
      }
    } catch {
      toast.error("Durum güncellenemedi");
    }
  };

  const handleUpdateYanit = async (id: string, yanit: string) => {
    try {
      const res = await fetch(`/api/arizalar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yanit }),
      });

      if (res.ok) {
        toast.success("Yanıt kaydedildi");
        await fetchArizalar();
      }
    } catch {
      toast.error("Yanıt kaydedilemedi");
    }
  };

  const formatTarih = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-6 w-6 text-orange-500" />
            Arıza Bildirimleri
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Bina arıza ve bakım taleplerini bildirin ve takip edin
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Bildirim
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Yükleniyor...</p>
      ) : arizalar.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Henüz arıza bildirimi yok
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {arizalar.map((ariza) => (
            <ArizaCard
              key={ariza.id}
              ariza={ariza}
              isYoneticiOrKapici={isYoneticiOrKapici}
              onUpdateDurum={handleUpdateDurum}
              onUpdateYanit={handleUpdateYanit}
              formatTarih={formatTarih}
            />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-500" />
              Yeni Arıza Bildirimi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input
                placeholder="Örn: Asansör arızası"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Konum</Label>
              <Input
                placeholder="Örn: 3. Kat Merdiven, Otopark"
                value={konum}
                onChange={(e) => setKonum(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                placeholder="Arıza hakkında detaylı bilgi verin..."
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting ? "Gönderiliyor..." : "Bildirim Gönder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ArizaCard({
  ariza,
  isYoneticiOrKapici,
  onUpdateDurum,
  onUpdateYanit,
  formatTarih,
}: {
  ariza: ArizaBildirimi;
  isYoneticiOrKapici: boolean;
  onUpdateDurum: (id: string, durum: string) => Promise<void>;
  onUpdateYanit: (id: string, yanit: string) => Promise<void>;
  formatTarih: (dateStr: string) => string;
}) {
  const [yanitText, setYanitText] = useState(ariza.yanit || "");
  const [yanitDirty, setYanitDirty] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{ariza.baslik}</CardTitle>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {ariza.user.ad} {ariza.user.soyad}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {ariza.konum}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatTarih(ariza.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isYoneticiOrKapici ? (
              <Select
                value={ariza.durum}
                onValueChange={(v) => v && onUpdateDurum(ariza.id, v)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEKLEMEDE">Beklemede</SelectItem>
                  <SelectItem value="INCELENIYOR">İnceleniyor</SelectItem>
                  <SelectItem value="TAMAMLANDI">Tamamlandı</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge className={DURUM_COLORS[ariza.durum]}>
                {DURUM_LABELS[ariza.durum]}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="whitespace-pre-wrap text-sm">{ariza.aciklama}</p>

        {isYoneticiOrKapici && (
          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
            <Label className="text-sm font-medium">Yanıt</Label>
            <Textarea
              placeholder="Arıza hakkında yanıt yazın..."
              value={yanitText}
              onChange={(e) => {
                setYanitText(e.target.value);
                setYanitDirty(true);
              }}
              rows={2}
            />
            {yanitDirty && (
              <Button
                size="sm"
                onClick={() => {
                  onUpdateYanit(ariza.id, yanitText);
                  setYanitDirty(false);
                }}
              >
                Yanıtı Kaydet
              </Button>
            )}
          </div>
        )}

        {!isYoneticiOrKapici && ariza.yanit && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Yanıt:
            </p>
            <p className="text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-400">
              {ariza.yanit}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
