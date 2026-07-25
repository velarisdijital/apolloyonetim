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
  Flame,
  Droplets,
  Wind,
  ShieldAlert,
  Heart,
  AlertCircle,
  AlertTriangle,
  User,
  Clock,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface AcilDurumBildirimi {
  id: string;
  tip: "YANGIN" | "SU_BASKINI" | "GAZ_KACAGI" | "GUVENLIK" | "SAGLIK" | "DIGER";
  aciklama: string | null;
  konum: string | null;
  cozuldu: boolean;
  cozumNotu: string | null;
  createdAt: string;
  user: { ad: string; soyad: string };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function te(t: any, key: string, fallback: string): string {
  return t.emergency?.[key] ?? fallback;
}

const TIP_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; badgeClass: string }
> = {
  YANGIN: {
    label: "Yangin",
    icon: Flame,
    color: "bg-red-500 hover:bg-red-600 text-white shadow-red-200 dark:shadow-red-900/40",
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  SU_BASKINI: {
    label: "Su Baskini",
    icon: Droplets,
    color: "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200 dark:shadow-blue-900/40",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  GAZ_KACAGI: {
    label: "Gaz Kacagi",
    icon: Wind,
    color: "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 dark:shadow-orange-900/40",
    badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  GUVENLIK: {
    label: "Guvenlik",
    icon: ShieldAlert,
    color: "bg-purple-500 hover:bg-purple-600 text-white shadow-purple-200 dark:shadow-purple-900/40",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  SAGLIK: {
    label: "Saglik",
    icon: Heart,
    color: "bg-green-500 hover:bg-green-600 text-white shadow-green-200 dark:shadow-green-900/40",
    badgeClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  DIGER: {
    label: "Diger",
    icon: AlertCircle,
    color: "bg-gray-500 hover:bg-gray-600 text-white shadow-gray-200 dark:shadow-gray-900/40",
    badgeClass: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  },
};

export default function AcilDurumPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [acilDurumlar, setAcilDurumlar] = useState<AcilDurumBildirimi[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTip, setSelectedTip] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aciklama, setAciklama] = useState("");
  const [konum, setKonum] = useState("");

  const isYoneticiOrKapici =
    session?.user?.rol === "MASTER_ADMIN" || session?.user?.rol === "KAPICI";

  const fetchAcilDurumlar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/acil-durum");
      if (res.ok) {
        setAcilDurumlar(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcilDurumlar();
  }, [fetchAcilDurumlar]);

  const handleEmergencyClick = (tip: string) => {
    setSelectedTip(tip);
    setAciklama("");
    setKonum("");
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!selectedTip) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/acil-durum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tip: selectedTip,
          aciklama: aciklama || undefined,
          konum: konum || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Hata");
      }

      toast.success(te(t, "reportedSuccess", "Acil durum bildirimi gonderildi!"));
      setDialogOpen(false);
      setSelectedTip(null);
      setAciklama("");
      setKonum("");
      await fetchAcilDurumlar();
    } catch {
      toast.error(t.errors?.generic || "Bir hata olustu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id: string, cozumNotu: string) => {
    try {
      const res = await fetch(`/api/acil-durum/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cozumNotu }),
      });

      if (res.ok) {
        toast.success(te(t, "resolvedSuccess", "Acil durum cozuldu olarak isaretlendi"));
        await fetchAcilDurumlar();
      }
    } catch {
      toast.error(t.errors?.generic || "Bir hata olustu");
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

  const tipLabel = (tip: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const types = (t as any).emergency?.types;
    return types?.[tip] || TIP_CONFIG[tip]?.label || tip;
  };

  const activeCount = acilDurumlar.filter((d) => !d.cozuldu).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            {te(t, "title", "Acil Durum")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {te(t, "subtitle", "Acil durumlari bildirin ve takip edin")}
          </p>
        </div>
        {activeCount > 0 && (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-sm px-3 py-1">
            {activeCount} {te(t, "activeCount", "Aktif Bildirim")}
          </Badge>
        )}
      </div>

      {/* Emergency Buttons Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {te(t, "reportEmergency", "Acil Durum Bildir")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(TIP_CONFIG).map(([tip, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={tip}
                  onClick={() => handleEmergencyClick(tip)}
                  className={`${config.color} rounded-xl p-6 flex flex-col items-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 cursor-pointer`}
                >
                  <Icon className="h-10 w-10" />
                  <span className="font-semibold text-base">{tipLabel(tip)}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Emergency History */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-500" />
          {te(t, "history", "Gecmis Bildirimler")}
        </h2>

        {loading ? (
          <p className="text-gray-500 text-sm">{t.common?.loading || "Yukleniyor..."}</p>
        ) : acilDurumlar.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {te(t, "noReports", "Henuz acil durum bildirimi yok")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {acilDurumlar.map((durum) => (
              <AcilDurumCard
                key={durum.id}
                durum={durum}
                isYoneticiOrKapici={isYoneticiOrKapici}
                onResolve={handleResolve}
                formatTarih={formatTarih}
                tipLabel={tipLabel}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {te(t, "confirmTitle", "Acil Durum Bildirimi")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTip && (
              <div
                className={`${TIP_CONFIG[selectedTip].color} rounded-lg p-4 flex items-center gap-3`}
              >
                {(() => {
                  const Icon = TIP_CONFIG[selectedTip].icon;
                  return <Icon className="h-6 w-6" />;
                })()}
                <span className="font-semibold">{tipLabel(selectedTip)}</span>
              </div>
            )}

            <p className="text-sm text-gray-600 dark:text-gray-400">
              {te(t, "confirmMessage", "Acil durum bildirmek istediginize emin misiniz?")}
            </p>

            <div className="space-y-2">
              <Label>{te(t, "location", "Konum (Opsiyonel)")}</Label>
              <Input
                placeholder={te(t, "locationPlaceholder", "Ornek: 3. kat, daire 12")}
                value={konum}
                onChange={(e) => setKonum(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{te(t, "description", "Aciklama (Opsiyonel)")}</Label>
              <Textarea
                placeholder={te(t, "descriptionPlaceholder", "Durumu kisaca aciklayiniz...")}
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
              >
                {t.common?.cancel || "Iptal"}
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleCreate}
                disabled={submitting}
              >
                {submitting
                  ? (t.common?.sending || "Gonderiliyor...")
                  : te(t, "sendReport", "Acil Durum Bildir")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AcilDurumCard({
  durum,
  isYoneticiOrKapici,
  onResolve,
  formatTarih,
  tipLabel,
}: {
  durum: AcilDurumBildirimi;
  isYoneticiOrKapici: boolean;
  onResolve: (id: string, cozumNotu: string) => Promise<void>;
  formatTarih: (dateStr: string) => string;
  tipLabel: (tip: string) => string;
}) {
  const { t } = useTranslation();
  const [cozumNotuText, setCozumNotuText] = useState("");
  const [showResolveForm, setShowResolveForm] = useState(false);

  const tipConfig = TIP_CONFIG[durum.tip];
  const Icon = tipConfig?.icon || AlertCircle;

  return (
    <Card className={!durum.cozuldu ? "border-red-300 dark:border-red-800" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`h-5 w-5 ${!durum.cozuldu ? "text-red-500" : "text-gray-400"}`} />
              <CardTitle className="text-lg">{tipLabel(durum.tip)}</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {durum.user.ad} {durum.user.soyad}
              </span>
              {durum.konum && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {durum.konum}
                  </span>
                </>
              )}
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatTarih(durum.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {durum.cozuldu ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                {te(t, "resolved", "Cozuldu")}
              </Badge>
            ) : (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {durum.aciklama && (
          <p className="whitespace-pre-wrap text-sm">{durum.aciklama}</p>
        )}

        {durum.cozuldu && durum.cozumNotu && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {te(t, "resolutionNote", "Cozum Notu")}:
            </p>
            <p className="text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-400">
              {durum.cozumNotu}
            </p>
          </div>
        )}

        {isYoneticiOrKapici && !durum.cozuldu && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            {!showResolveForm ? (
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950"
                onClick={() => setShowResolveForm(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {te(t, "markResolved", "Cozuldu Olarak Isaretle")}
              </Button>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {te(t, "resolutionNote", "Cozum Notu")}
                </Label>
                <Textarea
                  placeholder={te(t, "resolutionNotePlaceholder", "Cozum hakkinda not ekleyin...")}
                  value={cozumNotuText}
                  onChange={(e) => setCozumNotuText(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowResolveForm(false)}
                  >
                    {t.common?.cancel || "Iptal"}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      onResolve(durum.id, cozumNotuText);
                      setShowResolveForm(false);
                    }}
                  >
                    {te(t, "confirm", "Onayla")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
