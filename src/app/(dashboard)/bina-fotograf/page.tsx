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
import {
  Image as ImageIcon,
  Upload,
  Plus,
  Filter,
  Maximize2,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface BinaFotograf {
  id: string;
  baslik: string;
  aciklama: string | null;
  kategori: string;
  fotografYolu: string;
  createdAt: string;
  buildingId: string;
}

const KATEGORI_OPTIONS = [
  { value: "Dis Cephe", label: "Dis Cephe" },
  { value: "Giris", label: "Giris" },
  { value: "Bahce", label: "Bahce" },
  { value: "Otopark", label: "Otopark" },
  { value: "Cati", label: "Cati" },
  { value: "Ortak Alan", label: "Ortak Alan" },
  { value: "Tadilat", label: "Tadilat" },
  { value: "Diger", label: "Diger" },
];

export default function BinaFotografPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [fotograflar, setFotograflar] = useState<BinaFotograf[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<BinaFotograf | null>(null);

  // Form state
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [kategori, setKategori] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const userRole = (session?.user as { rol?: string })?.rol;
  const canManage = userRole === "MASTER_ADMIN" || userRole === "KAPICI";

  const fetchFotograflar = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterKategori) params.set("kategori", filterKategori);
      const queryStr = params.toString();
      const res = await fetch(`/api/bina-fotograf${queryStr ? `?${queryStr}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setFotograflar(data);
      }
    } catch (error) {
      console.error("Fotograflar yuklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, [filterKategori]);

  useEffect(() => {
    fetchFotograflar();
  }, [fetchFotograflar]);

  const resetForm = () => {
    setBaslik("");
    setAciklama("");
    setKategori("");
    setSelectedFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!baslik.trim()) {
      toast.error("Baslik zorunludur");
      return;
    }
    if (!kategori) {
      toast.error("Kategori zorunludur");
      return;
    }
    if (!selectedFile) {
      toast.error("Fotograf secin");
      return;
    }

    setSubmitting(true);
    try {
      let fotografYolu = "";

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) {
          toast.error("Dosya yuklenemedi");
          setSubmitting(false);
          return;
        }
        const uploadData = await uploadRes.json();
        fotografYolu = uploadData.path;
      }

      const payload = {
        baslik: baslik.trim(),
        aciklama: aciklama.trim() || undefined,
        kategori,
        fotografYolu,
      };

      const res = await fetch("/api/bina-fotograf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Fotograf basariyla eklendi");
        setDialogOpen(false);
        resetForm();
        fetchFotograflar();
      } else {
        const data = await res.json();
        toast.error(data.error || "Islem sirasinda hata olustu");
      }
    } catch {
      toast.error("Islem sirasinda hata olustu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/bina-fotograf/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Fotograf silindi");
        fetchFotograflar();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fotograf silinirken hata olustu");
      }
    } catch {
      toast.error("Fotograf silinirken hata olustu");
    }
  };

  const filteredFotograflar = fotograflar.filter(
    (item) =>
      item.baslik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.aciklama && item.aciklama.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const uniqueKategoriCount = new Set(fotograflar.map((f) => f.kategori)).size;

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
            Bina Fotograf Galerisi
          </h1>
          <p className="text-muted-foreground">
            Bina fotograflarini goruntuleyin ve yonetin
          </p>
        </div>
        {canManage && (
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Fotograf Ekle
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Fotograf</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fotograflar.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori Sayisi</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueKategoriCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Baslik veya aciklamaya gore ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterKategori || "all"} onValueChange={(v) => setFilterKategori(v === "all" ? "" : (v || ""))}>
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tum Kategoriler</SelectItem>
              {KATEGORI_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Photo Grid */}
      {filteredFotograflar.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchQuery || filterKategori
                ? "Sonuc bulunamadi"
                : "Henuz fotograf yuklenmemis"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredFotograflar.map((item) => (
            <Card key={item.id} className="relative overflow-hidden">
              <img
                src={item.fotografYolu}
                alt={item.baslik}
                className="w-full h-48 object-cover rounded-t-lg cursor-pointer"
                onClick={() => setSelectedPhoto(item)}
              />
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">{item.baslik}</p>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setSelectedPhoto(item)}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
                <Badge variant="outline">{item.kategori}</Badge>
                {item.aciklama && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.aciklama}
                  </p>
                )}
                {canManage && (
                  <div className="pt-1 border-t flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => { if (!open) setSelectedPhoto(null); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {selectedPhoto?.baslik}
            </DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <img
                src={selectedPhoto.fotografYolu}
                alt={selectedPhoto.baslik}
                className="w-full max-h-[60vh] object-contain rounded-lg"
              />
              {selectedPhoto.aciklama && (
                <p className="text-muted-foreground">{selectedPhoto.aciklama}</p>
              )}
              <Badge variant="outline">{selectedPhoto.kategori}</Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Fotograf Yukle
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Baslik *</Label>
              <Input
                placeholder="Orn: Bina on cephe"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Aciklama</Label>
              <Input
                placeholder="Fotograf hakkinda kisa aciklama"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Kategori *</Label>
              <Select value={kategori} onValueChange={(v) => setKategori(v || "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Secin" />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORI_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fotograf *</Label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Secilen: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); resetForm(); }}
            >
              {t.common?.cancel || "Iptal"}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? (t.common?.saving || "Yukleniyor...")
                : "Yukle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
