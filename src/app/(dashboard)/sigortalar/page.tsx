"use client";

import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n/context";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Shield, Plus, Calendar, AlertTriangle, Search, Trash2, Pencil } from "lucide-react";

interface SigortaPolice {
  id: string;
  tip: string;
  sirketAdi: string;
  policeNo: string | null;
  baslangicTarihi: string;
  bitisTarihi: string;
  primTutari: string | null;
  kapsam: string | null;
  not: string | null;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
  buildingId: string;
}

const TIP_OPTIONS = [
  { value: "DASK", label: "DASK" },
  { value: "Yangin", label: "Yangin" },
  { value: "Deprem", label: "Deprem" },
  { value: "Hirsizlik", label: "Hirsizlik" },
  { value: "Asansor", label: "Asansor" },
  { value: "Genel", label: "Genel" },
  { value: "Diger", label: "Diger" },
];

export default function SigortalarPage() {
  const { data: session } = useSession();
  const { t: _t } = useTranslation(); void _t;
  const userRole = session?.user?.rol;
  const canManage = userRole === "MASTER_ADMIN";

  const [sigortalar, setSigortalar] = useState<SigortaPolice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTip, setFilterTip] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSigorta, setSelectedSigorta] = useState<SigortaPolice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    tip: "",
    sirketAdi: "",
    policeNo: "",
    baslangicTarihi: "",
    bitisTarihi: "",
    primTutari: "",
    kapsam: "",
    not: "",
  });

  const fetchSigortalar = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterTip) params.set("tip", filterTip);
      const response = await fetch(`/api/sigortalar?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setSigortalar(data);
    } catch {
      toast.error("Sigorta policeleri yuklenirken hata olustu");
    } finally {
      setLoading(false);
    }
  }, [filterTip]);

  useEffect(() => {
    fetchSigortalar();
  }, [fetchSigortalar]);

  const filteredSigortalar = sigortalar.filter((s) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      s.sirketAdi.toLowerCase().includes(searchLower) ||
      (s.policeNo && s.policeNo.toLowerCase().includes(searchLower))
    );
  });

  const getExpiryDays = (bitisTarihi: string) => {
    const now = new Date();
    const endDate = new Date(bitisTarihi);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryBadge = (bitisTarihi: string) => {
    const days = getExpiryDays(bitisTarihi);
    if (days < 30) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {days} gun kaldi
        </Badge>
      );
    }
    if (days < 90) {
      return (
        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {days} gun kaldi
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Aktif
      </Badge>
    );
  };

  const aktifCount = sigortalar.length;
  const yakinBitenCount = sigortalar.filter(
    (s) => getExpiryDays(s.bitisTarihi) <= 90
  ).length;
  const toplamPrim = sigortalar.reduce((sum, s) => {
    return sum + (s.primTutari ? parseFloat(s.primTutari) : 0);
  }, 0);

  const openAddDialog = () => {
    setSelectedSigorta(null);
    setFormData({
      tip: "",
      sirketAdi: "",
      policeNo: "",
      baslangicTarihi: "",
      bitisTarihi: "",
      primTutari: "",
      kapsam: "",
      not: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (sigorta: SigortaPolice) => {
    setSelectedSigorta(sigorta);
    setFormData({
      tip: sigorta.tip,
      sirketAdi: sigorta.sirketAdi,
      policeNo: sigorta.policeNo || "",
      baslangicTarihi: sigorta.baslangicTarihi ? sigorta.baslangicTarihi.split("T")[0] : "",
      bitisTarihi: sigorta.bitisTarihi ? sigorta.bitisTarihi.split("T")[0] : "",
      primTutari: sigorta.primTutari || "",
      kapsam: sigorta.kapsam || "",
      not: sigorta.not || "",
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (sigorta: SigortaPolice) => {
    setSelectedSigorta(sigorta);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.tip || !formData.sirketAdi) {
      toast.error("Tip ve sirket adi zorunludur");
      return;
    }

    try {
      setSubmitting(true);
      const url = selectedSigorta
        ? `/api/sigortalar/${selectedSigorta.id}`
        : "/api/sigortalar";
      const method = selectedSigorta ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Islem basarisiz");
      }

      toast.success(
        selectedSigorta
          ? "Sigorta policesi guncellendi"
          : "Sigorta policesi eklendi"
      );
      setDialogOpen(false);
      fetchSigortalar();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Bir hata olustu"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSigorta) return;

    try {
      const response = await fetch(`/api/sigortalar/${selectedSigorta.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Silme islemi basarisiz");

      toast.success("Sigorta policesi silindi");
      setDeleteDialogOpen(false);
      setSelectedSigorta(null);
      fetchSigortalar();
    } catch {
      toast.error("Silme islemi sirasinda hata olustu");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Sigorta Policeleri
          </h1>
          <p className="text-muted-foreground">
            Bina sigorta policelerini yonetin
          </p>
        </div>
        {canManage && (
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Police
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Police</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aktifCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yakinda Biten</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yakinBitenCount}</div>
            <p className="text-xs text-muted-foreground">90 gun icinde</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Prim</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {toplamPrim.toLocaleString("tr-TR")} TL
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Sirket adi veya police no ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterTip} onValueChange={(v) => setFilterTip(v || "")}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Tip Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tumunu Goster</SelectItem>
            {TIP_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Yukleniyor...
        </div>
      ) : filteredSigortalar.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Sigorta policesi bulunamadi
            </h3>
            <p className="text-muted-foreground text-center">
              {canManage
                ? "Yeni bir sigorta policesi ekleyerek baslayabilirsiniz."
                : "Henuz sigorta policesi eklenmemis."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSigortalar.map((sigorta) => (
            <Card key={sigorta.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Badge variant="outline" className="mb-2">
                      {sigorta.tip}
                    </Badge>
                    <CardTitle className="text-lg">{sigorta.sirketAdi}</CardTitle>
                    {sigorta.policeNo && (
                      <CardDescription>
                        Police No: {sigorta.policeNo}
                      </CardDescription>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(sigorta)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(sigorta)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(sigorta.baslangicTarihi).toLocaleDateString("tr-TR")} -{" "}
                    {new Date(sigorta.bitisTarihi).toLocaleDateString("tr-TR")}
                  </span>
                </div>
                {sigorta.primTutari && (
                  <div className="text-sm font-medium">
                    Prim: {parseFloat(sigorta.primTutari).toLocaleString("tr-TR")} TL
                  </div>
                )}
                <div className="pt-2">
                  {getExpiryBadge(sigorta.bitisTarihi)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSigorta ? "Sigorta Policesi Duzenle" : "Yeni Sigorta Policesi"}
            </DialogTitle>
            <DialogDescription>
              {selectedSigorta
                ? "Sigorta policesi bilgilerini guncelleyin."
                : "Yeni bir sigorta policesi ekleyin."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tip">Tip *</Label>
              <Select
                value={formData.tip}
                onValueChange={(v) => setFormData({ ...formData, tip: v || "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tip secin" />
                </SelectTrigger>
                <SelectContent>
                  {TIP_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sirketAdi">Sirket Adi *</Label>
              <Input
                id="sirketAdi"
                value={formData.sirketAdi}
                onChange={(e) =>
                  setFormData({ ...formData, sirketAdi: e.target.value })
                }
                placeholder="Sigorta sirketi adi"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="policeNo">Police No</Label>
              <Input
                id="policeNo"
                value={formData.policeNo}
                onChange={(e) =>
                  setFormData({ ...formData, policeNo: e.target.value })
                }
                placeholder="Police numarasi"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="baslangicTarihi">Baslangic Tarihi</Label>
                <Input
                  id="baslangicTarihi"
                  type="date"
                  value={formData.baslangicTarihi}
                  onChange={(e) =>
                    setFormData({ ...formData, baslangicTarihi: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bitisTarihi">Bitis Tarihi</Label>
                <Input
                  id="bitisTarihi"
                  type="date"
                  value={formData.bitisTarihi}
                  onChange={(e) =>
                    setFormData({ ...formData, bitisTarihi: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="primTutari">Prim Tutari (TL)</Label>
              <Input
                id="primTutari"
                type="number"
                value={formData.primTutari}
                onChange={(e) =>
                  setFormData({ ...formData, primTutari: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kapsam">Kapsam</Label>
              <Input
                id="kapsam"
                value={formData.kapsam}
                onChange={(e) =>
                  setFormData({ ...formData, kapsam: e.target.value })
                }
                placeholder="Sigorta kapsami"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="not">Not</Label>
              <Input
                id="not"
                value={formData.not}
                onChange={(e) =>
                  setFormData({ ...formData, not: e.target.value })
                }
                placeholder="Ek notlar"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Iptal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? "Kaydediliyor..."
                : selectedSigorta
                ? "Guncelle"
                : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sigorta policesi silinsin mi?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            {selectedSigorta?.sirketAdi} - {selectedSigorta?.tip} policesi
            silinecek. Bu islem geri alinamaz.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Iptal</Button>
            <Button variant="destructive" onClick={handleDelete}>Sil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
