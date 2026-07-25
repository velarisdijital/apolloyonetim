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
  BarChart3,
  Plus,
  Vote,
  CheckCircle,
  Trash2,
  ClipboardList,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface AnketCevap {
  id: string;
  cevap: string;
  soruId: string;
  userId: string;
  user: { id: string; ad: string; soyad: string };
}

interface AnketSoru {
  id: string;
  soru: string;
  tip: string;
  secenekler: string;
  sira: number;
  zorunlu: boolean;
  cevaplar?: AnketCevap[];
  _count?: { cevaplar: number };
}

interface Anket {
  id: string;
  baslik: string;
  aciklama: string | null;
  durum: "AKTIF" | "TAMAMLANDI" | "IPTAL";
  bitisTarihi: string;
  anonim: boolean;
  createdAt: string;
  sorular: AnketSoru[];
  _count?: { sorular: number };
}

interface SoruForm {
  soru: string;
  tip: string;
  secenekler: string;
  zorunlu: boolean;
}

const DURUM_OPTIONS = [
  { value: "HEPSI", label: "Tumu" },
  { value: "AKTIF", label: "Aktif" },
  { value: "TAMAMLANDI", label: "Tamamlandi" },
  { value: "IPTAL", label: "Iptal" },
];

function getDurumBadge(durum: string) {
  switch (durum) {
    case "AKTIF":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "TAMAMLANDI":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "IPTAL":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

function getDurumLabel(durum: string) {
  switch (durum) {
    case "AKTIF":
      return "Aktif";
    case "TAMAMLANDI":
      return "Tamamlandi";
    case "IPTAL":
      return "Iptal Edildi";
    default:
      return durum;
  }
}

export default function AnketlerPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [anketler, setAnketler] = useState<Anket[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterDurum, setFilterDurum] = useState("HEPSI");
  const [submitting, setSubmitting] = useState(false);
  const [expandedAnketId, setExpandedAnketId] = useState<string | null>(null);
  const [detailAnket, setDetailAnket] = useState<Anket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Voting state
  const [votingAnketId, setVotingAnketId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [votingSubmitting, setVotingSubmitting] = useState(false);

  // Form state
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [bitisTarihi, setBitisTarihi] = useState("");
  const [anonim, setAnonim] = useState(false);
  const [sorular, setSorular] = useState<SoruForm[]>([
    { soru: "", tip: "TEKLI", secenekler: "", zorunlu: true },
  ]);

  const userRole = (session?.user as { rol?: string })?.rol;
  const userId = (session?.user as { id?: string })?.id;

  const fetchAnketler = useCallback(async () => {
    try {
      const res = await fetch("/api/anketler");
      if (res.ok) {
        const data = await res.json();
        setAnketler(data);
      }
    } catch (error) {
      console.error("Anketler yuklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnketler();
  }, [fetchAnketler]);

  const fetchAnketDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/anketler/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetailAnket(data);
      }
    } catch (error) {
      console.error("Anket detayi yuklenirken hata:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedAnketId === id) {
      setExpandedAnketId(null);
      setDetailAnket(null);
      setVotingAnketId(null);
      setAnswers({});
    } else {
      setExpandedAnketId(id);
      fetchAnketDetail(id);
    }
  };

  const resetForm = () => {
    setBaslik("");
    setAciklama("");
    setBitisTarihi("");
    setAnonim(false);
    setSorular([{ soru: "", tip: "TEKLI", secenekler: "", zorunlu: true }]);
  };

  const addSoru = () => {
    setSorular([...sorular, { soru: "", tip: "TEKLI", secenekler: "", zorunlu: true }]);
  };

  const removeSoru = (index: number) => {
    if (sorular.length <= 1) return;
    setSorular(sorular.filter((_, i) => i !== index));
  };

  const updateSoru = (index: number, field: keyof SoruForm, value: string | boolean) => {
    const updated = [...sorular];
    updated[index] = { ...updated[index], [field]: value };
    setSorular(updated);
  };

  const handleSubmit = async () => {
    if (!baslik.trim()) {
      toast.error("Anket basligi zorunludur");
      return;
    }
    if (!bitisTarihi) {
      toast.error("Bitis tarihi zorunludur");
      return;
    }
    for (const s of sorular) {
      if (!s.soru.trim()) {
        toast.error("Tum sorular doldurulmalidir");
        return;
      }
      if ((s.tip === "TEKLI" || s.tip === "COKLU") && !s.secenekler.trim()) {
        toast.error("Secenekli sorular icin secenekler girilmelidir");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/anketler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baslik: baslik.trim(),
          aciklama: aciklama.trim() || undefined,
          bitisTarihi,
          anonim,
          sorular: sorular.map((s) => ({
            soru: s.soru.trim(),
            tip: s.tip,
            secenekler: (s.tip === "TEKLI" || s.tip === "COKLU")
              ? JSON.stringify(s.secenekler.split(",").map((o) => o.trim()).filter(Boolean))
              : "[]",
            zorunlu: s.zorunlu,
          })),
        }),
      });

      if (res.ok) {
        toast.success("Anket basariyla olusturuldu");
        setDialogOpen(false);
        resetForm();
        fetchAnketler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Anket olusturulurken hata olustu");
      }
    } catch {
      toast.error("Anket olusturulurken hata olustu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteSubmit = async (anketId: string) => {
    if (!detailAnket) return;

    const zorunluSorular = detailAnket.sorular.filter((s) => s.zorunlu);
    for (const soru of zorunluSorular) {
      if (!answers[soru.id]?.trim()) {
        toast.error(`"${soru.soru}" sorusu zorunludur`);
        return;
      }
    }

    setVotingSubmitting(true);
    try {
      const cevaplar = detailAnket.sorular
        .filter((s) => answers[s.id]?.trim())
        .map((s) => ({ soruId: s.id, cevap: answers[s.id] }));

      const res = await fetch(`/api/anketler/${anketId}/cevapla`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cevaplar }),
      });

      if (res.ok) {
        toast.success("Cevaplar basariyla kaydedildi");
        setVotingAnketId(null);
        setAnswers({});
        fetchAnketDetail(anketId);
      } else {
        const data = await res.json();
        toast.error(data.error || "Cevaplar kaydedilirken hata olustu");
      }
    } catch {
      toast.error("Cevaplar kaydedilirken hata olustu");
    } finally {
      setVotingSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/anketler/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Anket silindi");
        if (expandedAnketId === id) {
          setExpandedAnketId(null);
          setDetailAnket(null);
        }
        fetchAnketler();
      } else {
        const data = await res.json();
        toast.error(data.error || "Anket silinirken hata olustu");
      }
    } catch {
      toast.error("Anket silinirken hata olustu");
    }
  };

  const handleDurumChange = async (id: string, durum: string) => {
    try {
      const res = await fetch(`/api/anketler/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durum }),
      });
      if (res.ok) {
        toast.success("Anket durumu guncellendi");
        fetchAnketler();
        if (expandedAnketId === id) {
          fetchAnketDetail(id);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Durum guncellenirken hata olustu");
      }
    } catch {
      toast.error("Durum guncellenirken hata olustu");
    }
  };

  const getResultsForSoru = (soru: AnketSoru) => {
    if (!soru.cevaplar || soru.cevaplar.length === 0) return [];

    let secenekler: string[] = [];
    try {
      secenekler = JSON.parse(soru.secenekler);
    } catch {
      return [];
    }

    if (soru.tip === "TEKLI") {
      const counts: Record<string, number> = {};
      secenekler.forEach((s) => (counts[s] = 0));
      soru.cevaplar.forEach((c) => {
        if (counts[c.cevap] !== undefined) counts[c.cevap]++;
        else counts[c.cevap] = 1;
      });
      const total = soru.cevaplar.length;
      return secenekler.map((s) => ({
        label: s,
        count: counts[s] || 0,
        percent: total > 0 ? Math.round(((counts[s] || 0) / total) * 100) : 0,
      }));
    }

    if (soru.tip === "COKLU") {
      const counts: Record<string, number> = {};
      secenekler.forEach((s) => (counts[s] = 0));
      const totalRespondents = soru.cevaplar.length;
      soru.cevaplar.forEach((c) => {
        try {
          const selected: string[] = JSON.parse(c.cevap);
          selected.forEach((s) => {
            if (counts[s] !== undefined) counts[s]++;
            else counts[s] = 1;
          });
        } catch {
          // skip invalid
        }
      });
      return secenekler.map((s) => ({
        label: s,
        count: counts[s] || 0,
        percent: totalRespondents > 0 ? Math.round(((counts[s] || 0) / totalRespondents) * 100) : 0,
      }));
    }

    // ACIK tip - just return text answers
    return soru.cevaplar.map((c) => ({
      label: c.cevap,
      count: 1,
      percent: 0,
      user: c.user,
    }));
  };

  const hasUserVoted = (anket: Anket) => {
    if (!anket.sorular?.[0]?.cevaplar) return false;
    return anket.sorular[0].cevaplar.some((c) => c.userId === userId);
  };

  const getParticipationCount = (anket: Anket) => {
    if (!anket.sorular?.[0]?.cevaplar) {
      // fallback to _count from list view
      const firstSoru = anket.sorular?.[0];
      return firstSoru?._count?.cevaplar || 0;
    }
    const uniqueUsers = new Set(
      anket.sorular.flatMap((s) => s.cevaplar?.map((c) => c.userId) || [])
    );
    return uniqueUsers.size;
  };

  const filteredAnketler = anketler.filter(
    (a) => filterDurum === "HEPSI" || a.durum === filterDurum
  );

  const activeCount = anketler.filter((a) => a.durum === "AKTIF").length;
  const completedCount = anketler.filter((a) => a.durum === "TAMAMLANDI").length;

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
          <h1 className="text-3xl font-bold tracking-tight">Anket Sistemi</h1>
          <p className="text-muted-foreground">
            Bina sakinleri icin anketler olusturun ve sonuclari goruntueleyin
          </p>
        </div>
        {userRole === "MASTER_ADMIN" && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Anket
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Anket</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anketler.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Anket</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium">Durum Filtresi:</Label>
        <Select value={filterDurum} onValueChange={(v) => setFilterDurum(v || "")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DURUM_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Survey List */}
      {filteredAnketler.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {filterDurum !== "HEPSI"
                ? "Bu filtreye uygun anket bulunamadi"
                : "Henuz anket olusturulmadi"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnketler.map((anket) => (
            <Card key={anket.id}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleExpand(anket.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{anket.baslik}</CardTitle>
                      {anket.aciklama && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {anket.aciklama}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {getParticipationCount(anket)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(anket.bitisTarihi).toLocaleDateString("tr-TR")}
                    </div>
                    <Badge className={getDurumBadge(anket.durum)}>
                      {getDurumLabel(anket.durum)}
                    </Badge>
                    {anket.anonim && (
                      <Badge variant="outline">Anonim</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {anket.sorular?.length || anket._count?.sorular || 0} soru
                    </span>
                    {expandedAnketId === anket.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Expanded Detail */}
              {expandedAnketId === anket.id && (
                <CardContent className="border-t pt-4 space-y-6">
                  {detailLoading ? (
                    <p className="text-muted-foreground text-center py-4">
                      {t.common.loading}
                    </p>
                  ) : detailAnket ? (
                    <>
                      {/* Admin Controls */}
                      {userRole === "MASTER_ADMIN" && (
                        <div className="flex items-center gap-2 pb-4 border-b">
                          {anket.durum === "AKTIF" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDurumChange(anket.id, "TAMAMLANDI");
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Tamamla
                            </Button>
                          )}
                          {anket.durum === "AKTIF" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDurumChange(anket.id, "IPTAL");
                              }}
                            >
                              Iptal Et
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive ml-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(anket.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </Button>
                        </div>
                      )}

                      {/* Vote Button */}
                      {anket.durum === "AKTIF" &&
                        !hasUserVoted(detailAnket) &&
                        votingAnketId !== anket.id && (
                          <Button
                            onClick={() => setVotingAnketId(anket.id)}
                            className="w-full"
                          >
                            <Vote className="mr-2 h-4 w-4" />
                            Anketi Cevapla
                          </Button>
                        )}

                      {hasUserVoted(detailAnket) && anket.durum === "AKTIF" && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Bu anketi zaten cevapladınız
                        </div>
                      )}

                      {/* Voting Interface */}
                      {votingAnketId === anket.id && (
                        <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                          <h3 className="font-semibold">Cevaplarınız</h3>
                          {detailAnket.sorular.map((soru) => {
                            let secenekler: string[] = [];
                            try {
                              secenekler = JSON.parse(soru.secenekler);
                            } catch {
                              // ignore
                            }

                            return (
                              <div key={soru.id} className="space-y-2">
                                <Label className="font-medium">
                                  {soru.soru}
                                  {soru.zorunlu && (
                                    <span className="text-destructive ml-1">*</span>
                                  )}
                                </Label>

                                {soru.tip === "TEKLI" && secenekler.length > 0 && (
                                  <div className="space-y-2">
                                    {secenekler.map((secenek) => (
                                      <label
                                        key={secenek}
                                        className="flex items-center gap-2 cursor-pointer"
                                      >
                                        <input
                                          type="radio"
                                          name={`soru-${soru.id}`}
                                          value={secenek}
                                          checked={answers[soru.id] === secenek}
                                          onChange={() =>
                                            setAnswers({ ...answers, [soru.id]: secenek })
                                          }
                                          className="h-4 w-4"
                                        />
                                        <span className="text-sm">{secenek}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}

                                {soru.tip === "COKLU" && secenekler.length > 0 && (
                                  <div className="space-y-2">
                                    {secenekler.map((secenek) => {
                                      let selected: string[] = [];
                                      try {
                                        selected = JSON.parse(answers[soru.id] || "[]");
                                      } catch {
                                        // ignore
                                      }
                                      return (
                                        <label
                                          key={secenek}
                                          className="flex items-center gap-2 cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={selected.includes(secenek)}
                                            onChange={() => {
                                              const newSelected = selected.includes(secenek)
                                                ? selected.filter((s) => s !== secenek)
                                                : [...selected, secenek];
                                              setAnswers({
                                                ...answers,
                                                [soru.id]: JSON.stringify(newSelected),
                                              });
                                            }}
                                            className="h-4 w-4"
                                          />
                                          <span className="text-sm">{secenek}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}

                                {soru.tip === "ACIK" && (
                                  <Textarea
                                    value={answers[soru.id] || ""}
                                    onChange={(e) =>
                                      setAnswers({
                                        ...answers,
                                        [soru.id]: e.target.value,
                                      })
                                    }
                                    placeholder="Cevabinizi yazin..."
                                    rows={3}
                                  />
                                )}
                              </div>
                            );
                          })}
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => handleVoteSubmit(anket.id)}
                              disabled={votingSubmitting}
                            >
                              {votingSubmitting ? "Kaydediliyor..." : "Gonder"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setVotingAnketId(null);
                                setAnswers({});
                              }}
                            >
                              {t.common?.cancel || "Iptal"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Results */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          <h3 className="font-semibold text-lg">Sonuclar</h3>
                          <span className="text-sm text-muted-foreground ml-auto">
                            {getParticipationCount(detailAnket)} katilimci
                          </span>
                        </div>

                        {detailAnket.sorular.map((soru) => {
                          const results = getResultsForSoru(soru);
                          const totalResponses = soru.cevaplar?.length || 0;

                          return (
                            <div key={soru.id} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">{soru.soru}</p>
                                <span className="text-xs text-muted-foreground">
                                  {totalResponses} cevap
                                </span>
                              </div>

                              {(soru.tip === "TEKLI" || soru.tip === "COKLU") && results.length > 0 ? (
                                <div className="space-y-2">
                                  {results.map((r) => (
                                    <div key={r.label} className="space-y-1">
                                      <div className="flex items-center justify-between text-sm">
                                        <span>{r.label}</span>
                                        <span className="text-muted-foreground">
                                          {r.count} oy ({r.percent}%)
                                        </span>
                                      </div>
                                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div
                                          className="h-full rounded-full bg-primary transition-all duration-300"
                                          style={{ width: `${r.percent}%` }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : soru.tip === "ACIK" && results.length > 0 ? (
                                <div className="space-y-2">
                                  {results.map((r, i) => (
                                    <div
                                      key={i}
                                      className="text-sm p-2 rounded bg-muted/50"
                                    >
                                      <span>{r.label}</span>
                                      <span className="text-xs text-muted-foreground ml-2">
                                        ({r.count} oy, %{r.percent})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  Henuz cevap yok
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : null}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Survey Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Yeni Anket Olustur
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Baslik *</Label>
              <Input
                placeholder="Anket basligi"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Aciklama</Label>
              <Textarea
                placeholder="Anket hakkinda kisa aciklama"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bitis Tarihi *</Label>
                <Input
                  type="date"
                  value={bitisTarihi}
                  onChange={(e) => setBitisTarihi(e.target.value)}
                />
              </div>
              <div className="space-y-2 flex items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={anonim}
                    onChange={(e) => setAnonim(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Anonim Anket</span>
                </label>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Sorular</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSoru}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Soru Ekle
                </Button>
              </div>

              {sorular.map((soru, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3 relative"
                >
                  {sorular.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute top-2 right-2 text-destructive hover:text-destructive"
                      onClick={() => removeSoru(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    Soru {index + 1}
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Sorunuzu yazin"
                      value={soru.soru}
                      onChange={(e) => updateSoru(index, "soru", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Soru Tipi</Label>
                      <Select
                        value={soru.tip}
                        onValueChange={(v) => updateSoru(index, "tip", v || "")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TEKLI">Tekli Secim</SelectItem>
                          <SelectItem value="COKLU">Coklu Secim</SelectItem>
                          <SelectItem value="ACIK">Acik Uclu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer pb-2">
                        <input
                          type="checkbox"
                          checked={soru.zorunlu}
                          onChange={(e) =>
                            updateSoru(index, "zorunlu", e.target.checked)
                          }
                          className="h-4 w-4"
                        />
                        <span className="text-sm">Zorunlu</span>
                      </label>
                    </div>
                  </div>

                  {(soru.tip === "TEKLI" || soru.tip === "COKLU") && (
                    <div className="space-y-2">
                      <Label className="text-xs">
                        Secenekler (virgul ile ayirin)
                      </Label>
                      <Input
                        placeholder="Evet, Hayir, Kararsizim"
                        value={soru.secenekler}
                        onChange={(e) =>
                          updateSoru(index, "secenekler", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
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
