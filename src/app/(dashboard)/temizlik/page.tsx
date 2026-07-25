"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Camera, Upload, Calendar, Trash2, Image } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface TemizlikKayit {
  id: string;
  alan: string;
  fotograflar: string;
  not: string | null;
  tarih: string;
  createdAt: string;
  buildingId: string;
  yukleyenId: string;
  yukleyen: { id: string; name: string | null };
}

const ALAN_OPTIONS = [
  { value: "Merdiven", label: "Merdiven" },
  { value: "Asansor", label: "Asansor" },
  { value: "Garaj", label: "Garaj" },
  { value: "Bahce", label: "Bahce" },
  { value: "Cop Odasi", label: "Cop Odasi" },
  { value: "Giris/Lobi", label: "Giris/Lobi" },
  { value: "Cati", label: "Cati" },
  { value: "Diger", label: "Diger" },
];

type DateFilter = "7" | "15" | "30";

export default function TemizlikPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [kayitlar, setKayitlar] = useState<TemizlikKayit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>("7");

  // Form state
  const [alan, setAlan] = useState("");
  const [notText, setNotText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  const userRole = (session?.user as { rol?: string })?.rol;
  const canUpload = userRole === "MASTER_ADMIN" || userRole === "KAPICI";

  const fetchKayitlar = useCallback(async () => {
    try {
      const baslangic = new Date();
      baslangic.setDate(baslangic.getDate() - parseInt(dateFilter));
      const params = new URLSearchParams();
      params.set("baslangic", baslangic.toISOString());
      const res = await fetch(`/api/temizlik?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setKayitlar(data);
      }
    } catch (error) {
      console.error("Temizlik kayitlari yuklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchKayitlar();
  }, [fetchKayitlar]);

  const resetForm = () => {
    setAlan("");
    setNotText("");
    setSelectedFiles(null);
  };

  const handleSubmit = async () => {
    if (!alan) {
      toast.error("Alan secimi zorunludur");
      return;
    }

    setSubmitting(true);
    setUploading(true);

    try {
      // Upload photos
      const fotografPaths: string[] = [];
      if (selectedFiles && selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const formData = new FormData();
          formData.append("file", selectedFiles[i]);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            fotografPaths.push(uploadData.path);
          } else {
            toast.error(`Fotograf yuklenirken hata: ${selectedFiles[i].name}`);
          }
        }
      }
      setUploading(false);

      const payload = {
        alan,
        fotograflar: fotografPaths,
        not: notText.trim() || undefined,
      };

      const res = await fetch("/api/temizlik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Temizlik kaydi basariyla eklendi");
        setDialogOpen(false);
        resetForm();
        fetchKayitlar();
      } else {
        const data = await res.json();
        toast.error(data.error || "Kayit eklenirken hata olustu");
      }
    } catch {
      toast.error("Kayit eklenirken hata olustu");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/temizlik/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Temizlik kaydi silindi");
        fetchKayitlar();
      } else {
        const data = await res.json();
        toast.error(data.error || "Kayit silinirken hata olustu");
      }
    } catch {
      toast.error("Kayit silinirken hata olustu");
    }
  };

  const parseFotograflar = (fotograflarStr: string): string[] => {
    try {
      return JSON.parse(fotograflarStr || "[]");
    } catch {
      return [];
    }
  };

  // Group records by date
  const groupedByDate = kayitlar.reduce<Record<string, TemizlikKayit[]>>(
    (acc, kayit) => {
      const dateKey = new Date(kayit.tarih).toLocaleDateString("tr-TR");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(kayit);
      return acc;
    },
    {}
  );

  // Stats
  const toplamKayit = kayitlar.length;
  const bugunStr = new Date().toLocaleDateString("tr-TR");
  const bugunKayit = kayitlar.filter(
    (k) => new Date(k.tarih).toLocaleDateString("tr-TR") === bugunStr
  ).length;
  const toplamFotograf = kayitlar.reduce((sum, k) => {
    return sum + parseFotograflar(k.fotograflar).length;
  }, 0);

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
            Temizlik Takip Sistemi
          </h1>
          <p className="text-muted-foreground">
            Bina temizlik kayitlarini yonetin ve takip edin
          </p>
        </div>
        {canUpload && (
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            Kayit Ekle
          </Button>
        )}
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
        <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Fotograflar 30 gun sonra otomatik silinir
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kayit</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toplamKayit}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bugunun Kayitlari
            </CardTitle>
            <Camera className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bugunKayit}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Fotograf
            </CardTitle>
            <Image className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toplamFotograf}</div>
          </CardContent>
        </Card>
      </div>

      {/* Date Filters */}
      <div className="flex gap-2">
        <Button
          variant={dateFilter === "7" ? "default" : "outline"}
          size="sm"
          onClick={() => setDateFilter("7")}
        >
          Son 7 Gun
        </Button>
        <Button
          variant={dateFilter === "15" ? "default" : "outline"}
          size="sm"
          onClick={() => setDateFilter("15")}
        >
          Son 15 Gun
        </Button>
        <Button
          variant={dateFilter === "30" ? "default" : "outline"}
          size="sm"
          onClick={() => setDateFilter("30")}
        >
          Son 30 Gun
        </Button>
      </div>

      {/* Records grouped by date */}
      {Object.keys(groupedByDate).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Image className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Henuz temizlik kaydi yok
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByDate).map(([date, records]) => (
          <div key={date} className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold">{date}</h2>
              <Badge variant="secondary">{records.length} kayit</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {records.map((kayit) => {
                const fotograflar = parseFotograflar(kayit.fotograflar);
                return (
                  <Card key={kayit.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Camera className="h-5 w-5" />
                          <CardTitle className="text-lg font-bold">
                            {kayit.alan}
                          </CardTitle>
                        </div>
                        {canUpload && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(kayit.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {fotograflar.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {fotograflar.map((foto, idx) => (
                            <img
                              key={idx}
                              src={foto}
                              alt={`Temizlik foto ${idx + 1}`}
                              className="w-full h-20 object-cover rounded-md border"
                            />
                          ))}
                        </div>
                      )}
                      {kayit.not && (
                        <p className="text-sm text-muted-foreground">
                          {kayit.not}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>
                          {kayit.yukleyen?.name || "Bilinmeyen"}
                        </span>
                        <span>
                          {new Date(kayit.tarih).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Add Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Temizlik Kaydi Ekle
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alan *</Label>
              <Select value={alan} onValueChange={(v) => setAlan(v || "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Alan secin" />
                </SelectTrigger>
                <SelectContent>
                  {ALAN_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fotograflar</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setSelectedFiles(e.target.files)}
              />
              {selectedFiles && selectedFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedFiles.length} dosya secildi
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Not</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Ek bilgi veya aciklama"
                value={notText}
                onChange={(e) => setNotText(e.target.value)}
              />
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
              {uploading
                ? "Fotograflar yukleniyor..."
                : submitting
                  ? (t.common?.saving || "Kaydediliyor...")
                  : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
