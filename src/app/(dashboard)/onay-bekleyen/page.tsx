"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClipboardCheck, Check, X, FileText, Image as ImageIcon, Clock } from "lucide-react";
import { toast } from "sonner";
import { KATEGORI_LABELS } from "@/lib/constants";
import { formatPara } from "@/lib/format";

interface Gider {
  id: string;
  aciklama: string;
  tutar: number;
  kategori: string;
  tarih: string;
  fisYolu: string | null;
  fisAdi: string | null;
  onayDurumu: string;
  onayNotu: string | null;
  createdAt: string;
  createdBy: { ad: string; soyad: string };
  onaylayan: { ad: string; soyad: string } | null;
}

const ONAY_BADGE: Record<string, string> = {
  BEKLEMEDE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  ONAYLANDI: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REDDEDILDI: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const ONAY_LABELS: Record<string, string> = {
  BEKLEMEDE: "Onay Bekliyor",
  ONAYLANDI: "Onaylandı",
  REDDEDILDI: "Reddedildi",
};

export default function OnayBekleyenPage() {
  const { data: session } = useSession();
  const [giderler, setGiderler] = useState<Gider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"BEKLEMEDE" | "ONAYLANDI" | "REDDEDILDI" | "TUMU">("BEKLEMEDE");
  const [selectedGider, setSelectedGider] = useState<Gider | null>(null);
  const [onayNotu, setOnayNotu] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchGiderler = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "TUMU" ? "/api/giderler" : `/api/giderler?onayDurumu=${filter}`;
      const res = await fetch(url);
      if (res.ok) setGiderler(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchGiderler();
  }, [fetchGiderler]);

  const handleOnay = async (id: string, onayDurumu: "ONAYLANDI" | "REDDEDILDI") => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/giderler/${id}/onay`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onayDurumu, onayNotu }),
      });
      if (res.ok) {
        toast.success(onayDurumu === "ONAYLANDI" ? "Gider onaylandı" : "Gider reddedildi");
        setSelectedGider(null);
        setOnayNotu("");
        await fetchGiderler();
      } else {
        toast.error("İşlem başarısız");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTarih = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const isDenetci = session?.user?.rol === "DENETCI" || session?.user?.rol === "MASTER_ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-amber-600" />
          Onay Bekleyenler
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Mali işlemleri inceleyin ve onaylayın
        </p>
      </div>

      <div className="flex gap-2">
        {(["BEKLEMEDE", "ONAYLANDI", "REDDEDILDI", "TUMU"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "TUMU" ? "Tümü" : ONAY_LABELS[f] || f}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Yükleniyor...</div>
        </div>
      ) : giderler.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-lg font-medium text-gray-500">
              {filter === "BEKLEMEDE" ? "Onay bekleyen gider yok" : "Kayıt bulunamadı"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {giderler.map((gider) => (
            <Card key={gider.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">
                        {KATEGORI_LABELS[gider.kategori] || gider.kategori}
                      </Badge>
                      <Badge className={ONAY_BADGE[gider.onayDurumu]}>
                        {ONAY_LABELS[gider.onayDurumu]}
                      </Badge>
                    </div>
                    <p className="font-medium">{gider.aciklama}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                        {formatPara(Number(gider.tutar))}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTarih(gider.tarih)}
                      </span>
                      <span>Ekleyen: {gider.createdBy.ad} {gider.createdBy.soyad}</span>
                      {gider.fisYolu && (
                        <a
                          href={gider.fisYolu}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {gider.fisYolu.endsWith(".pdf") ? (
                            <FileText className="h-3.5 w-3.5" />
                          ) : (
                            <ImageIcon className="h-3.5 w-3.5" />
                          )}
                          Fiş Görüntüle
                        </a>
                      )}
                    </div>
                    {gider.onayNotu && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                        Not: {gider.onayNotu}
                      </p>
                    )}
                    {gider.onaylayan && (
                      <p className="text-xs text-gray-400 mt-1">
                        Onaylayan: {gider.onaylayan.ad} {gider.onaylayan.soyad}
                      </p>
                    )}
                  </div>

                  {isDenetci && gider.onayDurumu === "BEKLEMEDE" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleOnay(gider.id, "ONAYLANDI")}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Onayla
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedGider(gider);
                          setOnayNotu("");
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reddet
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedGider} onOpenChange={(open) => !open && setSelectedGider(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Gideri Reddet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">
                <strong>{selectedGider?.aciklama}</strong> — {selectedGider ? formatPara(Number(selectedGider.tutar)) : ""}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Red Nedeni (opsiyonel)</Label>
              <Textarea
                placeholder="Red nedenini yazın..."
                value={onayNotu}
                onChange={(e) => setOnayNotu(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedGider(null)}
              >
                İptal
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={submitting}
                onClick={() => selectedGider && handleOnay(selectedGider.id, "REDDEDILDI")}
              >
                {submitting ? "İşleniyor..." : "Reddet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
