"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Plus,
  ChevronLeft,
  ChevronRight,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Eye,
  X,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";

const AY_ISIMLERI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

type DuesItem = {
  id: string;
  durum: string;
  apartmentId: string;
  apartment: { id: string; no: string; kat: number };
  payments: {
    id: string;
    tutar: string;
    tarih: string;
    dekontYolu?: string;
    dekontAdi?: string;
    onayDurumu: string;
    onayNotu?: string;
    aciklama?: string;
    user: { id: string; ad: string; soyad: string };
  }[];
};

type Dues = {
  id: string;
  ay: number;
  yil: number;
  tutarKisi: string;
  aciklama?: string;
  sonOdemeTarihi: string;
  items: DuesItem[];
};

type Daire = { id: string; no: string; kat: number };

function durumRenk(durum: string) {
  switch (durum) {
    case "ODENDI":
      return "bg-green-500 text-white";
    case "ONAY_BEKLIYOR":
      return "bg-yellow-500 text-white";
    case "KISMI":
      return "bg-amber-500 text-white";
    case "GECIKTI":
      return "bg-red-600 text-white";
    case "ODENMEDI":
    default:
      return "bg-red-500 text-white";
  }
}

function durumIcon(durum: string) {
  switch (durum) {
    case "ODENDI":
      return <CheckCircle2 className="w-4 h-4" />;
    case "ONAY_BEKLIYOR":
      return <Clock className="w-4 h-4" />;
    case "KISMI":
      return <AlertTriangle className="w-4 h-4" />;
    case "GECIKTI":
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <XCircle className="w-4 h-4" />;
  }
}

function durumLabel(durum: string) {
  switch (durum) {
    case "ODENDI": return "Ödendi";
    case "ONAY_BEKLIYOR": return "Onay Bekliyor";
    case "KISMI": return "Kısmi Ödeme";
    case "GECIKTI": return "Gecikti";
    default: return "Ödenmedi";
  }
}

function formatPara(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(num);
}

export default function AidatlarPage() {
  const { data: session } = useSession();
  const [yil, setYil] = useState(new Date().getFullYear());
  const [aidatlar, setAidatlar] = useState<Dues[]>([]);
  const [daireler, setDaireler] = useState<Daire[]>([]);
  const [bekleyenSayisi, setBekleyenSayisi] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ dues: Dues; item: DuesItem } | null>(null);
  const [showOdemeModal, setShowOdemeModal] = useState(false);
  const [showOnayModal, setShowOnayModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedPayment, setSelectedPayment] = useState<DuesItem["payments"][0] | null>(null);
  const [selectedDaire, setSelectedDaire] = useState<string>("all");

  const isAdmin = session?.user?.rol && ["MASTER_ADMIN", "KAPICI", "DENETCI"].includes(session.user.rol);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/aidatlar/takvim?yil=${yil}`);
      if (res.ok) {
        const data = await res.json();
        setAidatlar(data.aidatlar);
        setDaireler(data.daireler);
        setBekleyenSayisi(data.bekleyenSayisi);
      }
    } finally {
      setLoading(false);
    }
  }, [yil]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!session) return null;

  const getItemForMonth = (ay: number, apartmentId?: string): { dues: Dues; item: DuesItem } | null => {
    const dues = aidatlar.find((a) => a.ay === ay);
    if (!dues) return null;
    const aptId = apartmentId || session.user.apartmentId;
    const item = dues.items.find((i) => i.apartmentId === aptId);
    if (!item) return null;
    return { dues, item };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            Aidatlar
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {yil} yılı aidat takviminiz
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && bekleyenSayisi > 0 && (
            <Badge className="bg-yellow-500 text-white px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {bekleyenSayisi} onay bekliyor
            </Badge>
          )}
          {session.user.rol === "MASTER_ADMIN" && (
            <Link href="/aidatlar/tanimla">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Yeni Aidat
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Yıl Seçici */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); setYil(yil - 1); }}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-xl font-bold min-w-[80px] text-center">{yil}</span>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); setYil(yil + 1); }}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Admin: Daire Filtresi */}
      {isAdmin && daireler.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center">
          <Button
            size="sm"
            variant={selectedDaire === "all" ? "default" : "outline"}
            onClick={() => setSelectedDaire("all")}
          >
            Tüm Daireler
          </Button>
          {daireler.map((d) => (
            <Button
              key={d.id}
              size="sm"
              variant={selectedDaire === d.id ? "default" : "outline"}
              onClick={() => setSelectedDaire(d.id)}
            >
              Daire {d.no}
            </Button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : isAdmin && selectedDaire === "all" ? (
        <AdminTableView
          aidatlar={aidatlar}
          daireler={daireler}
          onCellClick={(dues, item) => {
            setSelectedItem({ dues, item });
            if (item.payments.some((p) => p.onayDurumu === "BEKLEMEDE")) {
              setShowOnayModal(true);
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {AY_ISIMLERI.map((ayAdi, i) => {
            const ay = i + 1;
            const result = getItemForMonth(ay, selectedDaire !== "all" ? selectedDaire : undefined);
            const durum = result?.item.durum || "TANIMSIZ";
            const hasDues = !!result;
            const tutar = result ? formatPara(result.dues.tutarKisi) : "";

            return (
              <button
                key={ay}
                onClick={() => {
                  if (!result) return;
                  setSelectedItem(result);
                  if (isAdmin && result.item.payments.some((p) => p.onayDurumu === "BEKLEMEDE")) {
                    setShowOnayModal(true);
                  } else if (!isAdmin && ["ODENMEDI", "GECIKTI", "KISMI"].includes(durum)) {
                    setShowOdemeModal(true);
                  }
                }}
                disabled={!hasDues}
                className={`relative rounded-xl p-4 text-left transition-all duration-200 border-2 ${
                  hasDues
                    ? "cursor-pointer hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
                    : "opacity-40 cursor-not-allowed"
                } ${
                  durum === "ODENDI"
                    ? "border-green-400 bg-green-50 dark:bg-green-950/30 dark:border-green-700"
                    : durum === "ONAY_BEKLIYOR"
                    ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700"
                    : durum === "KISMI"
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700"
                    : durum === "GECIKTI"
                    ? "border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-700"
                    : durum === "ODENMEDI"
                    ? "border-red-300 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800"
                    : "border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700"
                }`}
              >
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {ayAdi}
                </div>
                {hasDues && (
                  <>
                    <div className="text-lg font-bold mt-1 text-gray-900 dark:text-gray-100">
                      {tutar}
                    </div>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${durumRenk(durum)}`}
                      >
                        {durumIcon(durum)}
                        {durumLabel(durum)}
                      </span>
                    </div>
                  </>
                )}
                {!hasDues && (
                  <div className="text-xs text-gray-400 mt-2">Tanımsız</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Ödeme Gönder Modal */}
      {showOdemeModal && selectedItem && (
        <OdemeGonderModal
          dues={selectedItem.dues}
          item={selectedItem.item}
          onClose={() => { setShowOdemeModal(false); setSelectedItem(null); }}
          onSuccess={() => { setShowOdemeModal(false); setSelectedItem(null); fetchData(); }}
        />
      )}

      {/* Onay Modal (Admin) */}
      {showOnayModal && selectedItem && (
        <OnayModal
          dues={selectedItem.dues}
          item={selectedItem.item}
          onClose={() => { setShowOnayModal(false); setSelectedItem(null); }}
          onSuccess={() => { setShowOnayModal(false); setSelectedItem(null); fetchData(); }}
        />
      )}

      {/* Detay Görüntüleme - tıklanan hücrede ödeme yoksa veya ödendi ise */}
      {selectedItem && !showOdemeModal && !showOnayModal && (
        <DetayModal
          dues={selectedItem.dues}
          item={selectedItem.item}
          isAdmin={!!isAdmin}
          onClose={() => setSelectedItem(null)}
          onOdemeGonder={() => setShowOdemeModal(true)}
          onOnayAc={(payment) => {
            setSelectedPayment(payment);
            setShowOnayModal(true);
          }}
        />
      )}
    </div>
  );
}

function AdminTableView({
  aidatlar,
  daireler,
  onCellClick,
}: {
  aidatlar: Dues[];
  daireler: Daire[];
  onCellClick: (dues: Dues, item: DuesItem) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="w-5 h-5 text-gray-400" />
          Aidat Tablosu — Tüm Daireler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="sticky left-0 bg-white dark:bg-gray-950 z-10 text-left py-3 px-2 font-semibold min-w-[100px]">
                  Daire
                </th>
                {AY_ISIMLERI.map((ay, i) => {
                  const dues = aidatlar.find((a) => a.ay === i + 1);
                  return (
                    <th key={i} className="text-center py-3 px-1 min-w-[90px]">
                      <div className="font-semibold text-xs">{ay}</div>
                      {dues && (
                        <div className="text-[10px] text-gray-400 font-normal">
                          {formatPara(dues.tutarKisi)}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {daireler.map((daire) => (
                <tr key={daire.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="sticky left-0 bg-white dark:bg-gray-950 z-10 py-2 px-2 font-medium">
                    Daire {daire.no}
                    <span className="text-[10px] text-gray-400 ml-1">(K{daire.kat})</span>
                  </td>
                  {AY_ISIMLERI.map((_, i) => {
                    const ay = i + 1;
                    const dues = aidatlar.find((a) => a.ay === ay);
                    if (!dues) {
                      return (
                        <td key={i} className="text-center py-2 px-1">
                          <span className="text-gray-300 text-xs">—</span>
                        </td>
                      );
                    }
                    const item = dues.items.find((it) => it.apartmentId === daire.id);
                    if (!item) {
                      return (
                        <td key={i} className="text-center py-2 px-1">
                          <span className="text-gray-300 text-xs">—</span>
                        </td>
                      );
                    }
                    return (
                      <td key={i} className="text-center py-2 px-1">
                        <button
                          onClick={() => onCellClick(dues, item)}
                          className="block w-full py-1 cursor-pointer"
                        >
                          <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-1 rounded-full transition-all hover:scale-105 ${durumRenk(item.durum)}`}>
                            {durumIcon(item.durum)}
                            <span className="hidden sm:inline ml-0.5">{durumLabel(item.durum)}</span>
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function OdemeGonderModal({
  dues,
  item,
  onClose,
  onSuccess,
}: {
  dues: Dues;
  item: DuesItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [tutar, setTutar] = useState(Number(dues.tutarKisi).toString());
  const [aciklama, setAciklama] = useState("");
  const [dekontYolu, setDekontYolu] = useState("");
  const [dekontAdi, setDekontAdi] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Dosya 5MB'dan büyük olamaz");
      return;
    }

    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Yükleme hatası");
        return;
      }
      const data = await res.json();
      setDekontYolu(data.path);
      setDekontAdi(data.originalName);
    } catch {
      setError("Dosya yüklenirken hata oluştu");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!dekontYolu) {
      setError("Lütfen dekont yükleyin");
      return;
    }
    if (!tutar || parseFloat(tutar) <= 0) {
      setError("Geçerli bir tutar girin");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/aidatlar/odeme-gonder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duesItemId: item.id,
          tutar: parseFloat(tutar),
          dekontYolu,
          dekontAdi,
          aciklama,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gönderim hatası");
        return;
      }

      onSuccess();
    } catch {
      setError("Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold">Aidat Gönder</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {AY_ISIMLERI[dues.ay - 1]} {dues.yil}
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
              {formatPara(dues.tutarKisi)}
            </div>
            <div className="text-xs text-blue-500 mt-1">
              Daire {item.apartment.no}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ödeme Tutarı (₺)</label>
            <input
              type="number"
              value={tutar}
              onChange={(e) => setTutar(e.target.value)}
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dekont Yükle *</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleUpload}
              className="hidden"
            />
            {dekontYolu ? (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400 flex-1 truncate">
                  {dekontAdi}
                </span>
                <button
                  onClick={() => { setDekontYolu(""); setDekontAdi(""); }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-3 py-6 text-center hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Yükleniyor...
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-500">PDF veya Görsel Yükle</span>
                    <span className="text-[10px] text-gray-400">Maks 5MB</span>
                  </div>
                )}
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Açıklama (Opsiyonel)</label>
            <textarea
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              rows={2}
              placeholder="Ödeme ile ilgili not..."
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Button onClick={handleSubmit} disabled={submitting || !dekontYolu} className="w-full">
            {submitting ? "Gönderiliyor..." : "Ödeme Gönder"}
          </Button>

          <p className="text-[11px] text-gray-400 text-center">
            Dekontunuz yöneticiye gönderilecek ve onay sonrası ödendi olarak işaretlenecektir.
          </p>
        </div>
      </div>
    </div>
  );
}

function OnayModal({
  dues,
  item,
  onClose,
  onSuccess,
}: {
  dues: Dues;
  item: DuesItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [onayNotu, setOnayNotu] = useState("");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const bekleyenler = item.payments.filter((p) => p.onayDurumu === "BEKLEMEDE");

  const handleOnay = async (paymentId: string, durum: "ONAYLANDI" | "REDDEDILDI") => {
    setProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/aidatlar/onayla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          onayDurumu: durum,
          onayNotu: durum === "REDDEDILDI" ? onayNotu : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "İşlem hatası");
        return;
      }

      onSuccess();
    } catch {
      setError("Bir hata oluştu");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold">Ödeme Onayı</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {AY_ISIMLERI[dues.ay - 1]} {dues.yil}
                </div>
                <div className="text-xs text-blue-500 mt-0.5">
                  Daire {item.apartment.no} — Aidat: {formatPara(dues.tutarKisi)}
                </div>
              </div>
              <Badge className={durumRenk(item.durum)}>{durumLabel(item.durum)}</Badge>
            </div>
          </div>

          {bekleyenler.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Onay bekleyen ödeme bulunmuyor.
            </p>
          ) : (
            bekleyenler.map((payment) => (
              <div key={payment.id} className="border dark:border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{formatPara(payment.tutar)}</div>
                    <div className="text-xs text-gray-500">
                      {payment.user.ad} {payment.user.soyad} •{" "}
                      {new Date(payment.tarih).toLocaleDateString("tr-TR")}
                    </div>
                    {payment.aciklama && (
                      <div className="text-xs text-gray-400 mt-1">{payment.aciklama}</div>
                    )}
                  </div>
                </div>

                {payment.dekontYolu && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewUrl(payment.dekontYolu!)}
                      className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-950/30 rounded-lg px-3 py-1.5"
                    >
                      {payment.dekontYolu.endsWith(".pdf") ? (
                        <FileText className="w-4 h-4" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                      <span>Dekontu Görüntüle</span>
                    </button>
                    {payment.dekontAdi && (
                      <span className="text-[11px] text-gray-400 truncate max-w-[150px]">
                        {payment.dekontAdi}
                      </span>
                    )}
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    placeholder="Red notu (opsiyonel)"
                    value={onayNotu}
                    onChange={(e) => setOnayNotu(e.target.value)}
                    className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleOnay(payment.id, "ONAYLANDI")}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Onayla
                  </Button>
                  <Button
                    onClick={() => handleOnay(payment.id, "REDDEDILDI")}
                    disabled={processing}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reddet
                  </Button>
                </div>
              </div>
            ))
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {previewUrl && (
          <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
            <div className="relative max-w-3xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setPreviewUrl(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
              {previewUrl.endsWith(".pdf") ? (
                <iframe src={previewUrl} className="w-full h-[80vh] rounded-xl" />
              ) : (
                <img src={previewUrl} alt="Dekont" className="max-w-full max-h-[80vh] rounded-xl mx-auto" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetayModal({
  dues,
  item,
  isAdmin,
  onClose,
  onOdemeGonder,
  onOnayAc,
}: {
  dues: Dues;
  item: DuesItem;
  isAdmin: boolean;
  onClose: () => void;
  onOdemeGonder: () => void;
  onOnayAc: (payment: DuesItem["payments"][0]) => void;
}) {
  const canPay = !isAdmin && ["ODENMEDI", "GECIKTI", "KISMI"].includes(item.durum);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold">
            {AY_ISIMLERI[dues.ay - 1]} {dues.yil} — Daire {item.apartment.no}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500">Aidat Tutarı</div>
              <div className="text-2xl font-bold">{formatPara(dues.tutarKisi)}</div>
            </div>
            <span className={`inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full ${durumRenk(item.durum)}`}>
              {durumIcon(item.durum)}
              {durumLabel(item.durum)}
            </span>
          </div>

          {item.payments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Ödeme Geçmişi</h3>
              <div className="space-y-2">
                {item.payments.map((p) => (
                  <div key={p.id} className="border dark:border-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{formatPara(p.tutar)}</div>
                        <div className="text-xs text-gray-500">
                          {p.user.ad} {p.user.soyad} • {new Date(p.tarih).toLocaleDateString("tr-TR")}
                        </div>
                      </div>
                      <Badge
                        className={
                          p.onayDurumu === "ONAYLANDI"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : p.onayDurumu === "REDDEDILDI"
                            ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                        }
                      >
                        {p.onayDurumu === "ONAYLANDI" ? "Onaylandı" : p.onayDurumu === "REDDEDILDI" ? "Reddedildi" : "Beklemede"}
                      </Badge>
                    </div>
                    {p.onayNotu && (
                      <div className="text-xs text-red-500 mt-1 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">
                        Red notu: {p.onayNotu}
                      </div>
                    )}
                    {p.dekontYolu && (
                      <button
                        onClick={() => setPreviewUrl(p.dekontYolu!)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                      >
                        <Eye className="w-3 h-3" />
                        Dekontu Gör
                      </button>
                    )}
                    {isAdmin && p.onayDurumu === "BEKLEMEDE" && (
                      <button
                        onClick={() => onOnayAc(p)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        Onay İşlemi →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {canPay && (
            <Button onClick={onOdemeGonder} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Aidat Gönder
            </Button>
          )}
        </div>

        {previewUrl && (
          <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
            <div className="relative max-w-3xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setPreviewUrl(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
              {previewUrl.endsWith(".pdf") ? (
                <iframe src={previewUrl} className="w-full h-[80vh] rounded-xl" />
              ) : (
                <img src={previewUrl} alt="Dekont" className="max-w-full max-h-[80vh] rounded-xl mx-auto" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
