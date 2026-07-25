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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldAlert,
  Plus,
  AlertTriangle,
  Ban,
  Clock,
  Eye,
  Upload,
  X,
  Image as ImageIcon,
  Gavel,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

function getDurumLabels(t: ReturnType<typeof useTranslation>["t"]): Record<string, string> {
  return {
    BILDIRILDI: t.penalties.reported,
    UYARI_VERILDI: t.penalties.warningGiven,
    CEZA_VERILDI: t.penalties.fineGiven,
    IPTAL: t.penalties.cancelledStatus,
  };
}

function getKademeLabels(t: ReturnType<typeof useTranslation>["t"]): Record<number, string> {
  return {
    1: t.penalties.tier1,
    2: t.penalties.tier2,
    3: t.penalties.tier3,
    4: t.penalties.tier4,
  };
}

const DURUM_RENK: Record<string, string> = {
  BILDIRILDI: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  UYARI_VERILDI: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  CEZA_VERILDI: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  IPTAL: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};


type CezaKurali = {
  id: string;
  siraNo: number;
  eylem: string;
  uygulama: string;
  kademe: number;
  cezaOrani: string;
  tekrarKatla: boolean;
};

type Daire = { id: string; no: string; kat: number };

type Ihlal = {
  id: string;
  aciklama: string;
  kanitYollari: string[];
  durum: string;
  cezaTutar: string | null;
  yoneticiNotu: string | null;
  duvardaPaylas: boolean;
  createdAt: string;
  kural: { siraNo: number; eylem: string; kademe: number; cezaOrani: string };
  apartment: { id: string; no: string; kat: number };
  bildiren: { id: string; ad: string; soyad: string };
  onaylayan: { id: string; ad: string; soyad: string } | null;
};

type Ozet = { toplam: number; uyari: number; ceza: number; bekleyen: number };

export default function CezalarPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [ihlaller, setIhlaller] = useState<Ihlal[]>([]);
  const [ozet, setOzet] = useState<Ozet>({ toplam: 0, uyari: 0, ceza: 0, bekleyen: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [yil, setYil] = useState(new Date().getFullYear());
  const [filtreDurum, setFiltreDurum] = useState<string>("all");

  const [bildirModalOpen, setBildirModalOpen] = useState(false);
  const [kararModalOpen, setKararModalOpen] = useState(false);
  const [detayModalOpen, setDetayModalOpen] = useState(false);
  const [seciliIhlal, setSeciliIhlal] = useState<Ihlal | null>(null);

  const [kurallar, setKurallar] = useState<CezaKurali[]>([]);
  const [daireler, setDaireler] = useState<Daire[]>([]);

  const isYonetici = session?.user?.rol === "MASTER_ADMIN";
  const isKapici = session?.user?.rol === "KAPICI";

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ yil: yil.toString() });
      if (filtreDurum !== "all") params.set("durum", filtreDurum);

      const res = await fetch(`/api/cezalar?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setIhlaller(data.ihlaller);
      setOzet(data.ozet);
      setIsAdmin(data.isAdmin);
    } catch {
      toast.error(t.penalties.dataLoadError);
    } finally {
      setLoading(false);
    }
  }, [yil, filtreDurum, t]);

  const fetchKurallar = useCallback(async () => {
    try {
      const res = await fetch("/api/cezalar/kurallar");
      if (!res.ok) return;
      const data = await res.json();
      setKurallar(data.kurallar);
      setDaireler(data.daireler);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchKurallar();
  }, [fetchData, fetchKurallar]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-7 h-7" />
            {t.penalties.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t.penalties.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Yıl Navigasyonu */}
          <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setYil(y => y - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-sm min-w-[50px] text-center">{yil}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setYil(y => y + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          {(isYonetici || isKapici) && (
            <Button
              onClick={() => setBildirModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t.penalties.report}
            </Button>
          )}
        </div>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ozet.toplam}</p>
                <p className="text-xs text-muted-foreground">{t.penalties.totalViolations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ozet.uyari}</p>
                <p className="text-xs text-muted-foreground">{t.penalties.warnings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ozet.ceza}</p>
                <p className="text-xs text-muted-foreground">{t.penalties.fines}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ozet.bekleyen}</p>
                <p className="text-xs text-muted-foreground">{t.penalties.pendingDecision}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtre */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: t.penalties.all },
          { value: "BILDIRILDI", label: t.penalties.pending },
          { value: "UYARI_VERILDI", label: t.penalties.warningFilter },
          { value: "CEZA_VERILDI", label: t.penalties.finesFilter },
          { value: "IPTAL", label: t.penalties.cancelled },
        ].map((f) => (
          <Button
            key={f.value}
            variant={filtreDurum === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltreDurum(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* İhlal Listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t.penalties.totalViolations} ({ihlaller.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ihlaller.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t.penalties.noViolations}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ihlaller.map((ihlal) => (
                <div
                  key={ihlal.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={DURUM_RENK[ihlal.durum]}>
                          {getDurumLabels(t)[ihlal.durum]}
                        </Badge>
                        <Badge variant="outline">
                          {t.penalties.rule} #{ihlal.kural.siraNo}
                        </Badge>
                        {isAdmin && (
                          <Badge variant="secondary">
                            {t.penalties.apartment} {ihlal.apartment.no}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {({ 1: t.penalties.tier1, 2: t.penalties.tier2, 3: t.penalties.tier3, 4: t.penalties.tier4 } as Record<number, string>)[ihlal.kural.kademe]}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mt-2 line-clamp-2">
                        {ihlal.kural.eylem}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {ihlal.aciklama}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          {t.penalties.reportedBy}: {ihlal.bildiren.ad} {ihlal.bildiren.soyad}
                        </span>
                        <span>
                          {new Date(ihlal.createdAt).toLocaleDateString("tr-TR")}
                        </span>
                        {ihlal.cezaTutar && (
                          <span className="text-red-600 font-semibold">
                            {Number(ihlal.cezaTutar).toLocaleString("tr-TR")} TL
                          </span>
                        )}
                      </div>
                      {ihlal.yoneticiNotu && (
                        <p className="text-xs mt-1 text-muted-foreground italic">
                          {t.penalties.managerNote}: {ihlal.yoneticiNotu}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSeciliIhlal(ihlal);
                          setDetayModalOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {t.penalties.detailTitle}
                      </Button>
                      {isYonetici && ihlal.durum === "BILDIRILDI" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSeciliIhlal(ihlal);
                            setKararModalOpen(true);
                          }}
                        >
                          <Gavel className="w-4 h-4 mr-1" />
                          {t.penalties.decisionTitle}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bildir Modal */}
      <BildirModal
        open={bildirModalOpen}
        onClose={() => setBildirModalOpen(false)}
        kurallar={kurallar}
        daireler={daireler}
        t={t}
        onSuccess={() => {
          setBildirModalOpen(false);
          fetchData();
        }}
      />

      {/* Karar Modal */}
      {seciliIhlal && (
        <KararModal
          open={kararModalOpen}
          onClose={() => {
            setKararModalOpen(false);
            setSeciliIhlal(null);
          }}
          ihlal={seciliIhlal}
          onSuccess={() => {
            setKararModalOpen(false);
            setSeciliIhlal(null);
            fetchData();
          }}
        />
      )}

      {/* Detay Modal */}
      {seciliIhlal && (
        <DetayModal
          open={detayModalOpen}
          onClose={() => {
            setDetayModalOpen(false);
            setSeciliIhlal(null);
          }}
          ihlal={seciliIhlal}
        />
      )}
    </div>
  );
}

/* =============== BİLDİR MODAL =============== */

function BildirModal({
  open,
  onClose,
  kurallar,
  daireler,
  t,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  kurallar: CezaKurali[];
  daireler: Daire[];
  t: ReturnType<typeof useTranslation>["t"];
  onSuccess: () => void;
}) {
  const [kuralId, setKuralId] = useState("");
  const [apartmentId, setApartmentId] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [kanitDosyalar, setKanitDosyalar] = useState<File[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);

  const seciliKural = kurallar.find((k) => k.id === kuralId);

  async function handleSubmit() {
    if (!kuralId || !apartmentId || !aciklama.trim()) {
      toast.error(t.penalties.fillAllFields);
      return;
    }

    setYukleniyor(true);
    try {
      const kanitYollari: string[] = [];

      for (const dosya of kanitDosyalar) {
        const formData = new FormData();
        formData.append("file", dosya);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          kanitYollari.push(data.path);
        }
      }

      const res = await fetch("/api/cezalar/bildir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kuralId, apartmentId, aciklama, kanitYollari }),
      });

      if (!res.ok) throw new Error();

      toast.success(t.penalties.reported);
      setKuralId("");
      setApartmentId("");
      setAciklama("");
      setKanitDosyalar([]);
      onSuccess();
    } catch {
      toast.error(t.errors.generic);
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            {t.penalties.report}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>{t.penalties.apartment} *</Label>
            <Select value={apartmentId} onValueChange={(v) => setApartmentId(v || "")}>
              <SelectTrigger>
                <SelectValue placeholder={t.penalties.selectApartment} />
              </SelectTrigger>
              <SelectContent>
                {daireler.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {t.penalties.apartment} {d.no} (Kat {d.kat})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t.penalties.rule} *</Label>
            <Select value={kuralId} onValueChange={(v) => setKuralId(v || "")}>
              <SelectTrigger>
                <SelectValue placeholder={t.penalties.selectRule} />
              </SelectTrigger>
              <SelectContent>
                {kurallar.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    #{k.siraNo} - {k.eylem.substring(0, 80)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {seciliKural && (
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">{t.penalties.rule} #{seciliKural.siraNo}</p>
              <p className="text-muted-foreground">{seciliKural.eylem}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{getKademeLabels(t)[seciliKural.kademe]}</Badge>
                <Badge variant="outline">{seciliKural.uygulama}</Badge>
              </div>
            </div>
          )}

          <div>
            <Label>{t.penalties.description} *</Label>
            <Textarea
              placeholder={t.penalties.descriptionPlaceholder}
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label>{t.penalties.evidence}</Label>
            <div className="mt-1">
              <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm">{t.penalties.uploadEvidence}</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setKanitDosyalar((prev) => [...prev, ...files]);
                  }}
                />
              </label>
            </div>
            {kanitDosyalar.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {kanitDosyalar.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span className="max-w-[120px] truncate">{f.name}</span>
                    <button
                      onClick={() =>
                        setKanitDosyalar((prev) => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={yukleniyor}>
              {yukleniyor ? t.penalties.reporting : t.penalties.submitReport}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* =============== KARAR MODAL =============== */

function KararModal({
  open,
  onClose,
  ihlal,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  ihlal: Ihlal;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [karar, setKarar] = useState<string>("");
  const [cezaTutar, setCezaTutar] = useState("");
  const [yoneticiNotu, setYoneticiNotu] = useState("");
  const [duvardaPaylas, setDuvardaPaylas] = useState(true);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function handleSubmit() {
    if (!karar) {
      toast.error(t.penalties.selectDecisionError);
      return;
    }
    if (karar === "CEZA_VERILDI" && !cezaTutar) {
      toast.error(t.penalties.enterFineAmount);
      return;
    }

    setYukleniyor(true);
    try {
      const res = await fetch("/api/cezalar/karar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ihlalId: ihlal.id,
          karar,
          cezaTutar: karar === "CEZA_VERILDI" ? parseFloat(cezaTutar) : undefined,
          yoneticiNotu: yoneticiNotu || undefined,
          duvardaPaylas,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success(
        karar === "UYARI_VERILDI"
          ? t.penalties.warningGiven
          : karar === "CEZA_VERILDI"
            ? t.penalties.fineGiven
            : t.penalties.cancelledStatus
      );
      onSuccess();
    } catch {
      toast.error(t.errors.generic);
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="w-5 h-5" />
            {t.penalties.decisionTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* İhlal Özeti */}
          <div className="bg-muted p-3 rounded-lg text-sm">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary">{t.penalties.apartment} {ihlal.apartment.no}</Badge>
              <Badge variant="outline">{t.penalties.rule} #{ihlal.kural.siraNo}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{ihlal.kural.eylem}</p>
            <p className="mt-2 font-medium">{ihlal.aciklama}</p>
          </div>

          {/* Kanıtlar */}
          {ihlal.kanitYollari.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">{t.penalties.evidencePhotos}</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {ihlal.kanitYollari.map((yol, i) => (
                  <a
                    key={i}
                    href={yol}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border rounded p-1 hover:bg-muted"
                  >
                    {yol.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={yol} alt={`${t.penalties.evidence} ${i + 1}`} className="w-16 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center text-xs">
                        PDF
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Karar Seçimi */}
          <div>
            <Label>{t.penalties.decision} *</Label>
            <Select value={karar} onValueChange={(v) => setKarar(v || "")}>
              <SelectTrigger>
                <SelectValue placeholder={t.penalties.selectDecision} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UYARI_VERILDI">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    {t.penalties.warningOption}
                  </span>
                </SelectItem>
                <SelectItem value="CEZA_VERILDI">
                  <span className="flex items-center gap-2">
                    <Ban className="w-4 h-4 text-red-500" />
                    {t.penalties.fineOption}
                  </span>
                </SelectItem>
                <SelectItem value="IPTAL">
                  <span className="flex items-center gap-2">
                    <X className="w-4 h-4 text-gray-500" />
                    {t.penalties.cancelOption}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {karar === "CEZA_VERILDI" && (
            <div>
              <Label>{t.penalties.fineAmount} (TL) *</Label>
              <Input
                type="number"
                placeholder={t.penalties.fineAmountPlaceholder}
                value={cezaTutar}
                onChange={(e) => setCezaTutar(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t.penalties.tier}: {getKademeLabels(t)[ihlal.kural.kademe]} — {t.penalties.fineRate}: {ihlal.kural.cezaOrani}
              </p>
            </div>
          )}

          <div>
            <Label>{t.penalties.managerNote}</Label>
            <Textarea
              placeholder={t.penalties.managerNotePlaceholder}
              value={yoneticiNotu}
              onChange={(e) => setYoneticiNotu(e.target.value)}
              rows={2}
            />
          </div>

          {karar && karar !== "IPTAL" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="duvardaPaylas"
                checked={duvardaPaylas}
                onChange={(e) => setDuvardaPaylas(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="duvardaPaylas" className="text-sm">
                {t.penalties.shareOnWallDesc}
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={yukleniyor}
              variant={karar === "CEZA_VERILDI" ? "destructive" : "default"}
            >
              {yukleniyor ? t.common.processing : t.penalties.confirmDecision}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* =============== DETAY MODAL =============== */

function DetayModal({
  open,
  onClose,
  ihlal,
}: {
  open: boolean;
  onClose: () => void;
  ihlal: Ihlal;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {t.penalties.detailTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={DURUM_RENK[ihlal.durum]}>
              {getDurumLabels(t)[ihlal.durum]}
            </Badge>
            <Badge variant="secondary">{t.penalties.apartment} {ihlal.apartment.no}</Badge>
            <Badge variant="outline">{t.penalties.rule} #{ihlal.kural.siraNo}</Badge>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">{t.penalties.rule}</p>
            <p className="text-sm mt-1">{ihlal.kural.eylem}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">{t.penalties.tier}</p>
            <p className="text-sm mt-1">{getKademeLabels(t)[ihlal.kural.kademe]}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">{t.penalties.description}</p>
            <p className="text-sm mt-1">{ihlal.aciklama}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t.penalties.reportedBy}</p>
              <p className="text-sm mt-1">
                {ihlal.bildiren.ad} {ihlal.bildiren.soyad}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t.penalties.reportDate}</p>
              <p className="text-sm mt-1">
                {new Date(ihlal.createdAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {ihlal.onaylayan && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.penalties.managedBy}</p>
                <p className="text-sm mt-1">
                  {ihlal.onaylayan.ad} {ihlal.onaylayan.soyad}
                </p>
              </div>
              {ihlal.cezaTutar && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.penalties.fineAmount}</p>
                  <p className="text-sm mt-1 text-red-600 font-bold">
                    {Number(ihlal.cezaTutar).toLocaleString("tr-TR")} TL
                  </p>
                </div>
              )}
            </div>
          )}

          {ihlal.yoneticiNotu && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t.penalties.managerNote}</p>
              <p className="text-sm mt-1 italic">{ihlal.yoneticiNotu}</p>
            </div>
          )}

          {/* Kanıtlar */}
          {ihlal.kanitYollari.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{t.penalties.evidencePhotos}</p>
              <div className="grid grid-cols-2 gap-2">
                {ihlal.kanitYollari.map((yol, i) => (
                  <a
                    key={i}
                    href={yol}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all"
                  >
                    {yol.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={yol}
                        alt={`${t.penalties.evidence} ${i + 1}`}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 flex flex-col items-center justify-center bg-muted">
                        <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                        <span className="text-xs">PDF</span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              {t.common.close}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
