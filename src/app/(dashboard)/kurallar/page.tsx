"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { BookOpen, Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

interface Kural {
  id: string;
  baslik: string;
  icerik: string;
  kategori: string;
  sira: number;
  createdAt: string;
  createdBy: { ad: string; soyad: string };
}

const KATEGORI_RENKLERI: Record<string, string> = {
  GENEL: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  GUVENLIK: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  TEMIZLIK: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  GURULTU: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  OTOPARK: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ORTAK_ALAN: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const KATEGORI_LABELS: Record<string, string> = {
  GENEL: "Genel",
  GUVENLIK: "Güvenlik",
  TEMIZLIK: "Temizlik",
  GURULTU: "Gürültü",
  OTOPARK: "Otopark",
  ORTAK_ALAN: "Ortak Alan",
};

export default function KurallarPage() {
  const { data: session } = useSession();
  const [kurallar, setKurallar] = useState<Kural[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [baslik, setBaslik] = useState("");
  const [icerik, setIcerik] = useState("");
  const [kategori, setKategori] = useState("GENEL");

  const fetchKurallar = useCallback(async () => {
    try {
      const res = await fetch("/api/kurallar");
      if (res.ok) setKurallar(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKurallar();
  }, [fetchKurallar]);

  const handleCreate = async () => {
    if (!baslik.trim() || !icerik.trim()) {
      toast.error("Başlık ve içerik gereklidir");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/kurallar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baslik, icerik, kategori }),
      });
      if (!res.ok) throw new Error();
      toast.success("Kural eklendi");
      setDialogOpen(false);
      setBaslik("");
      setIcerik("");
      setKategori("GENEL");
      await fetchKurallar();
    } catch {
      toast.error("Kural eklenemedi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/kurallar?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Kural silindi");
        await fetchKurallar();
      }
    } catch {
      toast.error("Kural silinemedi");
    }
  };

  const isYonetici = session?.user?.rol === "MASTER_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Bina Kuralları
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Bina kuralları ve yönetmelikleri
          </p>
        </div>
        {isYonetici && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Kural Ekle
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Yükleniyor...</div>
        </div>
      ) : kurallar.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-lg font-medium text-gray-500">Henüz kural eklenmemiş</p>
            {isYonetici && (
              <p className="text-sm text-gray-400 mt-1">
                Bina kurallarını eklemek için yukarıdaki butona tıklayın
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {kurallar.map((kural, index) => (
            <Card key={kural.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {kural.baslik}
                        <Badge className={KATEGORI_RENKLERI[kural.kategori] || KATEGORI_RENKLERI.GENEL}>
                          {KATEGORI_LABELS[kural.kategori] || kural.kategori}
                        </Badge>
                      </CardTitle>
                    </div>
                  </div>
                  {isYonetici && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 flex-shrink-0"
                      onClick={() => handleDelete(kural.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {kural.icerik}
                </p>
                <p className="text-xs text-gray-400 mt-3">
                  Ekleyen: {kural.createdBy.ad} {kural.createdBy.soyad}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Yeni Kural Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input
                placeholder="Örn: Gürültü kuralları"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={kategori} onValueChange={(v) => v && setKategori(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(KATEGORI_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>İçerik</Label>
              <textarea
                className="w-full min-h-[120px] rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Kural detaylarını yazın..."
                value={icerik}
                onChange={(e) => setIcerik(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting ? "Kaydediliyor..." : "Kural Ekle"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
