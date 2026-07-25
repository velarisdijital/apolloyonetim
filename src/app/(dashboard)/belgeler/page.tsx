"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { formatTarih } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Shield,
  FileCheck,
  Building,
  Upload,
  Download,
  Trash2,
  AlertTriangle,
  Clock,
  FolderOpen,
  Plus,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTranslations = Record<string, any>;

interface Belge {
  id: string;
  baslik: string;
  kategori: string;
  dosyaYolu: string;
  dosyaAdi: string;
  dosyaBoyut: number | null;
  aciklama: string | null;
  gecerlilikTarihi: string | null;
  createdAt: string;
  yukleyen: { ad: string; soyad: string };
}

const KATEGORILER = [
  { value: "TUMU", label: "Tumu" },
  { value: "SIGORTA", label: "Sigorta" },
  { value: "SOZLESME", label: "Sozlesme" },
  { value: "YONETIM_PLANI", label: "Yonetim Plani" },
  { value: "DASK", label: "DASK" },
  { value: "ISKAN", label: "Iskan" },
  { value: "PROJE", label: "Proje" },
  { value: "DIGER", label: "Diger" },
] as const;

const KATEGORI_LABELS: Record<string, string> = {
  SIGORTA: "Sigorta",
  SOZLESME: "Sozlesme",
  YONETIM_PLANI: "Yonetim Plani",
  DASK: "DASK",
  ISKAN: "Iskan",
  PROJE: "Proje",
  DIGER: "Diger",
};

const KATEGORI_COLORS: Record<string, string> = {
  SIGORTA: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  SOZLESME: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  YONETIM_PLANI: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  DASK: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  ISKAN: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  PROJE: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  DIGER: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

function getKategoriIcon(kategori: string) {
  switch (kategori) {
    case "SIGORTA":
      return <Shield className="h-4 w-4" />;
    case "SOZLESME":
      return <FileCheck className="h-4 w-4" />;
    case "DASK":
      return <Building className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

const ALLOWED_EXTENSIONS = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function BelgelerPage() {
  const { data: session } = useSession();
  const { t: _t } = useTranslation();
  const t = _t as AnyTranslations;
  const [belgeler, setBelgeler] = useState<Belge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("TUMU");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [formBaslik, setFormBaslik] = useState("");
  const [formKategori, setFormKategori] = useState("DIGER");
  const [formAciklama, setFormAciklama] = useState("");
  const [formGecerlilik, setFormGecerlilik] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);

  const userRole = (session?.user as { rol?: string })?.rol;
  const isMasterAdmin = userRole === "MASTER_ADMIN";

  const fetchBelgeler = useCallback(async (kategori?: string) => {
    try {
      const params = kategori && kategori !== "TUMU" ? `?kategori=${kategori}` : "";
      const res = await fetch(`/api/belgeler${params}`);
      if (res.ok) {
        const data = await res.json();
        setBelgeler(data);
      }
    } catch (error) {
      console.error("Belgeler yuklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBelgeler(activeTab);
  }, [activeTab, fetchBelgeler]);

  const handleTabChange = (value: string | number | null) => {
    if (value !== null) {
      setActiveTab(String(value));
      setLoading(true);
    }
  };

  const resetForm = () => {
    setFormBaslik("");
    setFormKategori("DIGER");
    setFormAciklama("");
    setFormGecerlilik("");
    setFormFile(null);
  };

  const handleUpload = async () => {
    if (!formBaslik.trim()) {
      toast.error(t.documents?.titleRequired || "Baslik zorunludur");
      return;
    }
    if (!formFile) {
      toast.error(t.documents?.fileRequired || "Dosya secmeniz gerekiyor");
      return;
    }
    if (formFile.size > MAX_FILE_SIZE) {
      toast.error(t.documents?.fileTooLarge || "Dosya boyutu 10MB'dan buyuk olamaz");
      return;
    }

    setUploading(true);
    try {
      // Upload file first
      const formData = new FormData();
      formData.append("file", formFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        toast.error(err.error || "Dosya yuklenemedi");
        return;
      }

      const { path: dosyaYolu } = await uploadRes.json();

      // Create document record
      const belgeRes = await fetch("/api/belgeler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baslik: formBaslik.trim(),
          kategori: formKategori,
          dosyaYolu,
          dosyaAdi: formFile.name,
          dosyaBoyut: formFile.size,
          aciklama: formAciklama.trim() || null,
          gecerlilikTarihi: formGecerlilik || null,
        }),
      });

      if (!belgeRes.ok) {
        const err = await belgeRes.json();
        toast.error(err.error || "Belge olusturulamadi");
        return;
      }

      toast.success(t.documents?.uploadSuccess || "Belge basariyla yuklendi");
      setDialogOpen(false);
      resetForm();
      fetchBelgeler(activeTab);
    } catch (error) {
      console.error("Belge yukleme hatasi:", error);
      toast.error(t.documents?.uploadError || "Belge yuklenirken hata olustu");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.documents?.deleteConfirm || "Bu belgeyi silmek istediginize emin misiniz?")) {
      return;
    }

    setDeleting(id);
    try {
      const res = await fetch(`/api/belgeler?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(t.documents?.deleteSuccess || "Belge silindi");
        fetchBelgeler(activeTab);
      } else {
        const err = await res.json();
        toast.error(err.error || "Belge silinemedi");
      }
    } catch (error) {
      console.error("Belge silme hatasi:", error);
      toast.error(t.documents?.deleteError || "Belge silinirken hata olustu");
    } finally {
      setDeleting(null);
    }
  };

  if (loading && belgeler.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{t.common?.loading || "Yukleniyor..."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t.documents?.title || "Belge Yonetimi"}
          </h1>
          <p className="text-muted-foreground">
            {t.documents?.subtitle || "Bina belgelerini goruntuleyin ve yonetin"}
          </p>
        </div>
        {isMasterAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t.documents?.upload || "Belge Yukle"}
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t.documents?.uploadTitle || "Yeni Belge Yukle"}</DialogTitle>
                <DialogDescription>
                  {t.documents?.uploadDescription || "PDF, DOC, DOCX, JPG veya PNG dosyasi yukleyin (maks. 10MB)"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="belge-baslik">{t.documents?.titleLabel || "Baslik"}</Label>
                  <Input
                    id="belge-baslik"
                    value={formBaslik}
                    onChange={(e) => setFormBaslik(e.target.value)}
                    placeholder={t.documents?.titlePlaceholder || "Belge basligi"}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t.documents?.categoryLabel || "Kategori"}</Label>
                  <Select value={formKategori} onValueChange={(val) => { if (val) setFormKategori(val); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KATEGORILER.filter((k) => k.value !== "TUMU").map((k) => (
                        <SelectItem key={k.value} value={k.value}>
                          {k.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="belge-aciklama">{t.documents?.descriptionLabel || "Aciklama"}</Label>
                  <textarea
                    id="belge-aciklama"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formAciklama}
                    onChange={(e) => setFormAciklama(e.target.value)}
                    placeholder={t.documents?.descriptionPlaceholder || "Belge aciklamasi (istege bagli)"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="belge-gecerlilik">
                    {t.documents?.validityLabel || "Gecerlilik Tarihi"}
                  </Label>
                  <Input
                    id="belge-gecerlilik"
                    type="date"
                    value={formGecerlilik}
                    onChange={(e) => setFormGecerlilik(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="belge-dosya">{t.documents?.fileLabel || "Dosya"}</Label>
                  <Input
                    id="belge-dosya"
                    type="file"
                    accept={ALLOWED_EXTENSIONS}
                    onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, JPG, PNG - maks. 10MB
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                  disabled={uploading}
                >
                  {t.common?.cancel || "Iptal"}
                </Button>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      {t.documents?.uploading || "Yukleniyor..."}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {t.documents?.upload || "Yukle"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex-wrap">
          {KATEGORILER.map((k) => (
            <TabsTrigger key={k.value} value={k.value}>
              {k.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {KATEGORILER.map((k) => (
          <TabsContent key={k.value} value={k.value}>
            {belgeler.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    {t.documents?.noDocuments || "Henuz belge bulunmuyor"}
                  </p>
                  {isMasterAdmin && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {t.documents?.noDocumentsHint || "Yeni belge yuklemek icin yukaridaki butonu kullanin"}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {belgeler.map((belge) => (
                  <Card key={belge.id} className="relative group">
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="shrink-0 text-muted-foreground">
                            {getKategoriIcon(belge.kategori)}
                          </div>
                          <h3 className="font-semibold text-sm truncate">
                            {belge.baslik}
                          </h3>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${
                            KATEGORI_COLORS[belge.kategori] || KATEGORI_COLORS.DIGER
                          }`}
                        >
                          {KATEGORI_LABELS[belge.kategori] || belge.kategori}
                        </span>
                      </div>

                      {/* Description */}
                      {belge.aciklama && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {belge.aciklama}
                        </p>
                      )}

                      {/* File info */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span className="truncate">{belge.dosyaAdi}</span>
                        {belge.dosyaBoyut && (
                          <span className="shrink-0">({formatFileSize(belge.dosyaBoyut)})</span>
                        )}
                      </div>

                      {/* Validity date */}
                      {belge.gecerlilikTarihi && (
                        <div
                          className={`flex items-center gap-1.5 text-xs ${
                            isExpired(belge.gecerlilikTarihi)
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {isExpired(belge.gecerlilikTarihi) ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          <span>
                            {isExpired(belge.gecerlilikTarihi)
                              ? (t.documents?.expired || "Suresi dolmus")
                              : (t.documents?.validUntil || "Gecerlilik")}
                            : {formatTarih(belge.gecerlilikTarihi)}
                          </span>
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                        <span>
                          {belge.yukleyen.ad} {belge.yukleyen.soyad}
                        </span>
                        <span>{formatTarih(belge.createdAt)}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={belge.dosyaYolu}
                          download={belge.dosyaAdi}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            {t.documents?.download || "Indir"}
                          </Button>
                        </a>
                        {isMasterAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(belge.id)}
                            disabled={deleting === belge.id}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
