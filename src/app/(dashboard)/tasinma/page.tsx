"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n/context";
import { toast } from "sonner";
import {
  Truck,
  ArrowRightLeft,
  Plus,
  Key,
  Calendar,
  Search,
  Filter,
  Trash2,
  Edit,
} from "lucide-react";
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

interface TasinmaBildirimi {
  id: string;
  tip: string;
  adSoyad: string;
  daireBilgisi: string;
  tarih: string;
  asansorRezervasyon: boolean;
  anahtarTeslim: boolean;
  not: string | null;
  createdAt: string;
  updatedAt: string;
  buildingId: string;
}

const TIP_OPTIONS = [
  { value: "GIRIS", label: "Giris (Tasinma)" },
  { value: "CIKIS", label: "Cikis (Ayrilma)" },
];

export default function TasinmaPage() {
  const { data: session } = useSession();
  const { t: _t } = useTranslation(); void _t;

  const [bildirimler, setBildirimler] = useState<TasinmaBildirimi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTip, setFilterTip] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBildirim, setEditingBildirim] = useState<TasinmaBildirimi | null>(null);

  // Form state
  const [tip, setTip] = useState("");
  const [adSoyad, setAdSoyad] = useState("");
  const [daireBilgisi, setDaireBilgisi] = useState("");
  const [tarih, setTarih] = useState("");
  const [asansorRezervasyon, setAsansorRezervasyon] = useState(false);
  const [anahtarTeslim, setAnahtarTeslim] = useState(false);
  const [not, setNot] = useState("");

  const canManage =
    session?.user?.rol === "MASTER_ADMIN" || session?.user?.rol === "KAPICI";

  const fetchBildirimler = async () => {
    try {
      const res = await fetch("/api/tasinma");
      if (!res.ok) throw new Error("Veri alinamadi");
      const data = await res.json();
      setBildirimler(data);
    } catch {
      toast.error("Bildirimler yuklenirken hata olustu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBildirimler();
  }, []);

  const resetForm = () => {
    setTip("");
    setAdSoyad("");
    setDaireBilgisi("");
    setTarih("");
    setAsansorRezervasyon(false);
    setAnahtarTeslim(false);
    setNot("");
    setEditingBildirim(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (bildirim: TasinmaBildirimi) => {
    setEditingBildirim(bildirim);
    setTip(bildirim.tip);
    setAdSoyad(bildirim.adSoyad);
    setDaireBilgisi(bildirim.daireBilgisi);
    setTarih(bildirim.tarih ? bildirim.tarih.split("T")[0] : "");
    setAsansorRezervasyon(bildirim.asansorRezervasyon);
    setAnahtarTeslim(bildirim.anahtarTeslim);
    setNot(bildirim.not || "");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!tip || !adSoyad.trim() || !daireBilgisi.trim()) {
      toast.error("Lutfen zorunlu alanlari doldurun");
      return;
    }

    try {
      const payload = {
        tip,
        adSoyad,
        daireBilgisi,
        tarih: tarih || null,
        asansorRezervasyon,
        anahtarTeslim,
        not: not || null,
      };

      let res;
      if (editingBildirim) {
        res = await fetch(`/api/tasinma/${editingBildirim.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/tasinma", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Islem basarisiz");
      }

      toast.success(
        editingBildirim
          ? "Bildirim basariyla guncellendi"
          : "Bildirim basariyla eklendi"
      );
      setDialogOpen(false);
      resetForm();
      fetchBildirimler();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Bir hata olustu";
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu bildirimi silmek istediginize emin misiniz?")) return;

    try {
      const res = await fetch(`/api/tasinma/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silme basarisiz");
      toast.success("Bildirim basariyla silindi");
      fetchBildirimler();
    } catch {
      toast.error("Bildirim silinirken hata olustu");
    }
  };

  const filteredBildirimler = bildirimler.filter((b) => {
    const matchesTip = !filterTip || b.tip === filterTip;
    const matchesSearch =
      !searchTerm ||
      b.adSoyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.daireBilgisi.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTip && matchesSearch;
  });

  const toplamBildirim = bildirimler.length;
  const girisSayisi = bildirimler.filter((b) => b.tip === "GIRIS").length;
  const cikisSayisi = bildirimler.filter((b) => b.tip === "CIKIS").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Tasinma Bildirimi Sistemi
          </h1>
          <p className="text-muted-foreground">
            Bina giris ve cikis bildirimlerini yonetin
          </p>
        </div>
        {canManage && (
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Bildirim
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Bildirim
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toplamBildirim}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giris</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {girisSayisi}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cikis</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {cikisSayisi}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ad soyad veya daire bilgisi ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterTip} onValueChange={(v) => setFilterTip(v || "")}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tip Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tumu</SelectItem>
            {TIP_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards Grid */}
      {filteredBildirimler.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Bildirim bulunamadi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBildirimler.map((bildirim) => (
            <Card key={bildirim.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={bildirim.tip === "GIRIS" ? "default" : "destructive"}
                    className={
                      bildirim.tip === "GIRIS"
                        ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100"
                        : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-100"
                    }
                  >
                    {bildirim.tip === "GIRIS" ? "Giris" : "Cikis"}
                  </Badge>
                  {canManage && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(bildirim)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(bildirim.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg">{bildirim.adSoyad}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {bildirim.daireBilgisi}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {bildirim.tarih
                    ? new Date(bildirim.tarih).toLocaleDateString("tr-TR")
                    : "-"}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Key
                      className={`h-4 w-4 ${
                        bildirim.anahtarTeslim
                          ? "text-green-500"
                          : "text-gray-300"
                      }`}
                    />
                    <span className="text-xs text-muted-foreground">
                      Anahtar
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowRightLeft
                      className={`h-4 w-4 ${
                        bildirim.asansorRezervasyon
                          ? "text-green-500"
                          : "text-gray-300"
                      }`}
                    />
                    <span className="text-xs text-muted-foreground">
                      Asansor
                    </span>
                  </div>
                </div>
                {bildirim.not && (
                  <p className="text-sm text-muted-foreground border-t pt-2">
                    {bildirim.not}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBildirim ? "Bildirimi Duzenle" : "Yeni Bildirim Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tasinma Tipi *</Label>
              <Select value={tip} onValueChange={(v) => setTip(v || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Tip secin" />
                </SelectTrigger>
                <SelectContent>
                  {TIP_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ad Soyad *</Label>
              <Input
                value={adSoyad}
                onChange={(e) => setAdSoyad(e.target.value)}
                placeholder="Ad soyad girin"
              />
            </div>
            <div className="space-y-2">
              <Label>Daire Bilgisi *</Label>
              <Input
                value={daireBilgisi}
                onChange={(e) => setDaireBilgisi(e.target.value)}
                placeholder="Ornegin: A Blok Daire 5"
              />
            </div>
            <div className="space-y-2">
              <Label>Tarih</Label>
              <Input
                type="date"
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-5 h-5 border rounded cursor-pointer flex items-center justify-center ${
                  asansorRezervasyon
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-input"
                }`}
                onClick={() => setAsansorRezervasyon(!asansorRezervasyon)}
              >
                {asansorRezervasyon && <span className="text-xs">✓</span>}
              </div>
              <Label>Asansor Rezervasyonu</Label>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-5 h-5 border rounded cursor-pointer flex items-center justify-center ${
                  anahtarTeslim
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-input"
                }`}
                onClick={() => setAnahtarTeslim(!anahtarTeslim)}
              >
                {anahtarTeslim && <span className="text-xs">✓</span>}
              </div>
              <Label>Anahtar Teslim</Label>
            </div>
            <div className="space-y-2">
              <Label>Not</Label>
              <Input
                value={not}
                onChange={(e) => setNot(e.target.value)}
                placeholder="Ek not (istege bagli)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Iptal
            </Button>
            <Button onClick={handleSubmit}>
              {editingBildirim ? "Guncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
