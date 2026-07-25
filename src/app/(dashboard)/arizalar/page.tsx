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
import { Wrench, Plus, MapPin, User, Clock, Camera, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface ArizaBildirimi {
  id: string;
  baslik: string;
  aciklama: string;
  konum: string;
  durum: "BEKLEMEDE" | "INCELENIYOR" | "TAMAMLANDI";
  oncelik: "DUSUK" | "NORMAL" | "YUKSEK" | "ACIL";
  fotograflar: string[];
  tahminiMaliyet: number | null;
  yanit: string | null;
  createdAt: string;
  user: { ad: string; soyad: string };
}

const DURUM_COLORS: Record<string, string> = {
  BEKLEMEDE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  INCELENIYOR: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  TAMAMLANDI: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const ONCELIK_COLORS: Record<string, string> = {
  DUSUK: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  NORMAL: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  YUKSEK: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  ACIL: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const ONCELIK_LABELS: Record<string, string> = {
  DUSUK: "Düşük",
  NORMAL: "Normal",
  YUKSEK: "Yüksek",
  ACIL: "Acil",
};

export default function ArizalarPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [arizalar, setArizalar] = useState<ArizaBildirimi[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [konum, setKonum] = useState("");
  const [oncelik, setOncelik] = useState("NORMAL");
  const [fotograflar, setFotograflar] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newPhotos: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Dosya 5MB'dan büyük olamaz");
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          newPhotos.push(data.url);
        }
      }
      setFotograflar((prev) => [...prev, ...newPhotos]);
    } catch {
      toast.error(t.errors.generic);
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!baslik || !aciklama || !konum) {
      toast.error(t.maintenance.allFieldsRequired);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/arizalar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baslik, aciklama, konum, oncelik, fotograflar }),
      });

      if (!res.ok) {
        throw new Error(t.errors.generic);
      }

      toast.success(t.maintenance.createdSuccess);
      setDialogOpen(false);
      setBaslik("");
      setAciklama("");
      setKonum("");
      setOncelik("NORMAL");
      setFotograflar([]);
      await fetchArizalar();
    } catch {
      toast.error(t.errors.generic);
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
        toast.success(t.maintenance.statusUpdated);
        await fetchArizalar();
      }
    } catch {
      toast.error(t.errors.generic);
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
        toast.success(t.maintenance.responseSaved);
        await fetchArizalar();
      }
    } catch {
      toast.error(t.errors.generic);
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
            {t.maintenance.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t.maintenance.subtitle}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t.maintenance.addNew}
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">{t.common.loading}</p>
      ) : arizalar.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {t.maintenance.noRequests}
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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-500" />
              {t.maintenance.addTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.maintenance.requestTitle}</Label>
              <Input
                placeholder={t.maintenance.requestTitlePlaceholder}
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.maintenance.location}</Label>
              <Input
                placeholder={t.maintenance.locationPlaceholder}
                value={konum}
                onChange={(e) => setKonum(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Öncelik</Label>
              <Select value={oncelik} onValueChange={(v) => setOncelik(v || "")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DUSUK">Düşük</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="YUKSEK">Yüksek</SelectItem>
                  <SelectItem value="ACIL">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      Acil
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.maintenance.description}</Label>
              <Textarea
                placeholder={t.maintenance.descriptionPlaceholder}
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Camera className="h-4 w-4" />
                Fotoğraf Ekle
              </Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {uploading && <p className="text-xs text-gray-500">Yükleniyor...</p>}
              {fotograflar.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {fotograflar.map((foto, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img src={foto} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-bl"
                        onClick={() => setFotograflar((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting ? t.common.sending : t.common.submit}
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
  const { t } = useTranslation();
  const [yanitText, setYanitText] = useState(ariza.yanit || "");
  const [yanitDirty, setYanitDirty] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  return (
    <>
      <Card className={ariza.oncelik === "ACIL" ? "border-red-300 dark:border-red-800" : ""}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{ariza.baslik}</CardTitle>
                <Badge className={ONCELIK_COLORS[ariza.oncelik] || ONCELIK_COLORS.NORMAL}>
                  {ariza.oncelik === "ACIL" && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {ONCELIK_LABELS[ariza.oncelik] || "Normal"}
                </Badge>
              </div>
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
                    <SelectItem value="BEKLEMEDE">{t.maintenance.statuses.BEKLEMEDE}</SelectItem>
                    <SelectItem value="INCELENIYOR">{t.maintenance.statuses.INCELENIYOR}</SelectItem>
                    <SelectItem value="TAMAMLANDI">{t.maintenance.statuses.TAMAMLANDI}</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={DURUM_COLORS[ariza.durum]}>
                  {t.maintenance.statuses[ariza.durum as keyof typeof t.maintenance.statuses]}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="whitespace-pre-wrap text-sm">{ariza.aciklama}</p>

          {ariza.fotograflar && ariza.fotograflar.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ariza.fotograflar.map((foto, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity"
                  onClick={() => setPreviewImg(foto)}
                >
                  <img src={foto} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              <span className="flex items-center text-xs text-gray-400 gap-1">
                <ImageIcon className="h-3.5 w-3.5" />
                {ariza.fotograflar.length} fotoğraf
              </span>
            </div>
          )}

          {ariza.tahminiMaliyet && isYoneticiOrKapici && (
            <p className="text-sm text-gray-500">
              Tahmini Maliyet: <span className="font-medium text-gray-700 dark:text-gray-300">₺{Number(ariza.tahminiMaliyet).toLocaleString("tr-TR")}</span>
            </p>
          )}

          {isYoneticiOrKapici && (
            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
              <Label className="text-sm font-medium">{t.maintenance.response}</Label>
              <Textarea
                placeholder={t.maintenance.responsePlaceholder}
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
                  {t.maintenance.saveResponse}
                </Button>
              )}
            </div>
          )}

          {!isYoneticiOrKapici && ariza.yanit && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.maintenance.response}:
              </p>
              <p className="text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                {ariza.yanit}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {previewImg && (
        <Dialog open={!!previewImg} onOpenChange={() => setPreviewImg(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <img src={previewImg} alt="Arıza fotoğrafı" className="w-full rounded-lg" />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
