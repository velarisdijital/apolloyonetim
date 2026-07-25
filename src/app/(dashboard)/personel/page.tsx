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
  Users,
  Plus,
  DollarSign,
  Calendar,
  CheckCircle,
  Edit,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface Personel {
  id: string;
  ad: string;
  soyad: string;
  gorev: string;
  telefon: string | null;
  tcNo: string | null;
  sgkNo: string | null;
  iseBaslama: string | null;
  maas: string | null;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
  buildingId: string;
  _count: { maaslar: number };
}

interface PersonelMaas {
  id: string;
  ay: number;
  yil: number;
  brutMaas: string;
  netMaas: string;
  sgkPrim: string | null;
  vergi: string | null;
  odenmeTarihi: string | null;
  odendi: boolean;
  not: string | null;
  createdAt: string;
  personelId: string;
}

const GOREV_OPTIONS = [
  { value: "Kapici", label: "Kapici" },
  { value: "Temizlikci", label: "Temizlikci" },
  { value: "Guvenlik", label: "Guvenlik" },
  { value: "Bahcivan", label: "Bahcivan" },
  { value: "Teknisyen", label: "Teknisyen" },
  { value: "Diger", label: "Diger" },
];

const AY_OPTIONS = [
  { value: "1", label: "Ocak" },
  { value: "2", label: "Subat" },
  { value: "3", label: "Mart" },
  { value: "4", label: "Nisan" },
  { value: "5", label: "Mayis" },
  { value: "6", label: "Haziran" },
  { value: "7", label: "Temmuz" },
  { value: "8", label: "Agustos" },
  { value: "9", label: "Eylul" },
  { value: "10", label: "Ekim" },
  { value: "11", label: "Kasim" },
  { value: "12", label: "Aralik" },
];

function getAyLabel(ay: number) {
  return AY_OPTIONS.find((o) => o.value === String(ay))?.label || String(ay);
}

export default function PersonelPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [personeller, setPersoneller] = useState<Personel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [gorev, setGorev] = useState("");
  const [telefon, setTelefon] = useState("");
  const [maas, setMaas] = useState("");
  const [iseBaslama, setIseBaslama] = useState("");

  // Salary dialog state
  const [maasDialogOpen, setMaasDialogOpen] = useState(false);
  const [selectedPersonel, setSelectedPersonel] = useState<Personel | null>(null);
  const [maaslar, setMaaslar] = useState<PersonelMaas[]>([]);
  const [maasLoading, setMaasLoading] = useState(false);
  const [maasSubmitting, setMaasSubmitting] = useState(false);

  // Salary form state
  const [maasAy, setMaasAy] = useState("");
  const [maasYil, setMaasYil] = useState(String(new Date().getFullYear()));
  const [maasBrut, setMaasBrut] = useState("");
  const [maasNet, setMaasNet] = useState("");
  const [maasSgk, setMaasSgk] = useState("");
  const [maasVergi, setMaasVergi] = useState("");
  const [maasNot, setMaasNot] = useState("");

  const userRole = (session?.user as { rol?: string })?.rol;
  const canManage = userRole === "MASTER_ADMIN";

  const fetchPersoneller = useCallback(async () => {
    try {
      const res = await fetch("/api/personel");
      if (res.ok) {
        const data = await res.json();
        setPersoneller(data);
      }
    } catch (error) {
      console.error("Personeller yuklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersoneller();
  }, [fetchPersoneller]);

  const resetForm = () => {
    setAd("");
    setSoyad("");
    setGorev("");
    setTelefon("");
    setMaas("");
    setIseBaslama("");
    setEditingId(null);
  };

  const resetMaasForm = () => {
    setMaasAy("");
    setMaasYil(String(new Date().getFullYear()));
    setMaasBrut("");
    setMaasNet("");
    setMaasSgk("");
    setMaasVergi("");
    setMaasNot("");
  };

  const openEditDialog = (item: Personel) => {
    setEditingId(item.id);
    setAd(item.ad);
    setSoyad(item.soyad);
    setGorev(item.gorev);
    setTelefon(item.telefon || "");
    setMaas(item.maas || "");
    setIseBaslama(item.iseBaslama ? item.iseBaslama.split("T")[0] : "");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!ad.trim()) {
      toast.error("Ad zorunludur");
      return;
    }

    if (!soyad.trim()) {
      toast.error("Soyad zorunludur");
      return;
    }

    if (!gorev) {
      toast.error("Gorev zorunludur");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ad: ad.trim(),
        soyad: soyad.trim(),
        gorev,
        telefon: telefon.trim() || undefined,
        maas: maas || undefined,
        iseBaslama: iseBaslama || undefined,
      };

      let res: Response;

      if (editingId) {
        res = await fetch(`/api/personel/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/personel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success(editingId ? "Personel guncellendi" : "Personel basariyla eklendi");
        setDialogOpen(false);
        resetForm();
        fetchPersoneller();
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
      const res = await fetch(`/api/personel/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Personel silindi");
        fetchPersoneller();
      } else {
        const data = await res.json();
        toast.error(data.error || "Personel silinirken hata olustu");
      }
    } catch {
      toast.error("Personel silinirken hata olustu");
    }
  };

  const fetchMaaslar = async (personelId: string) => {
    setMaasLoading(true);
    try {
      const res = await fetch(`/api/personel/${personelId}/maas`);
      if (res.ok) {
        const data = await res.json();
        setMaaslar(data);
      }
    } catch (error) {
      console.error("Maas kayitlari yuklenirken hata:", error);
    } finally {
      setMaasLoading(false);
    }
  };

  const openMaasDialog = (item: Personel) => {
    setSelectedPersonel(item);
    setMaasDialogOpen(true);
    resetMaasForm();
    fetchMaaslar(item.id);
  };

  const handleMaasSubmit = async () => {
    if (!selectedPersonel) return;

    if (!maasAy) {
      toast.error("Ay secimi zorunludur");
      return;
    }

    if (!maasYil) {
      toast.error("Yil zorunludur");
      return;
    }

    if (!maasBrut) {
      toast.error("Brut maas zorunludur");
      return;
    }

    if (!maasNet) {
      toast.error("Net maas zorunludur");
      return;
    }

    setMaasSubmitting(true);
    try {
      const payload = {
        ay: maasAy,
        yil: maasYil,
        brutMaas: maasBrut,
        netMaas: maasNet,
        sgkPrim: maasSgk || undefined,
        vergi: maasVergi || undefined,
        not: maasNot.trim() || undefined,
      };

      const res = await fetch(`/api/personel/${selectedPersonel.id}/maas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Maas kaydi eklendi");
        resetMaasForm();
        fetchMaaslar(selectedPersonel.id);
      } else {
        const data = await res.json();
        toast.error(data.error || "Maas kaydi eklenirken hata olustu");
      }
    } catch {
      toast.error("Maas kaydi eklenirken hata olustu");
    } finally {
      setMaasSubmitting(false);
    }
  };

  const handleMarkPaid = async (maasId: string) => {
    if (!selectedPersonel) return;

    try {
      const res = await fetch(`/api/personel/${selectedPersonel.id}/maas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maasId }),
      });

      if (res.ok) {
        toast.success("Maas odendi olarak isaretlendi");
        fetchMaaslar(selectedPersonel.id);
      } else {
        const data = await res.json();
        toast.error(data.error || "Islem sirasinda hata olustu");
      }
    } catch {
      toast.error("Islem sirasinda hata olustu");
    }
  };

  const filteredPersoneller = personeller.filter(
    (item) =>
      item.ad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.soyad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.gorev.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toplamMaas = personeller.reduce(
    (sum, p) => sum + (p.maas ? parseFloat(p.maas) : 0),
    0
  );

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
            Personel ve Maas Takibi
          </h1>
          <p className="text-muted-foreground">
            Bina personellerini ve maas kayitlarini yonetin
          </p>
        </div>
        {canManage && (
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Personel Ekle
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Personel</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personeller.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Personel</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personeller.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Maas</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {toplamMaas.toLocaleString("tr-TR")} TL
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Ada, soyada veya goreve gore ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Personnel Grid */}
      {filteredPersoneller.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchQuery
                ? "Sonuc bulunamadi"
                : "Henuz personel kaydi yok"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPersoneller.map((item) => (
            <Card key={item.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <CardTitle className="text-lg font-bold">
                      {item.ad} {item.soyad}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline">{item.gorev}</Badge>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Aktif
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {item.telefon && (
                  <p className="text-sm text-muted-foreground">
                    Telefon: {item.telefon}
                  </p>
                )}
                {item.iseBaslama && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Ise Baslama: {new Date(item.iseBaslama).toLocaleDateString("tr-TR")}
                  </p>
                )}
                {item.maas && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Maas: {parseFloat(item.maas).toLocaleString("tr-TR")} TL
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Maas Kaydi: {item._count.maaslar}
                </p>
                {canManage && (
                  <div className="pt-2 border-t flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openMaasDialog(item)}
                      title="Maas Kayitlari"
                    >
                      <DollarSign className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
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

      {/* Add/Edit Personnel Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {editingId ? "Personel Duzenle" : "Personel Ekle"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ad *</Label>
                <Input
                  placeholder="Orn: Ahmet"
                  value={ad}
                  onChange={(e) => setAd(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Soyad *</Label>
                <Input
                  placeholder="Orn: Yilmaz"
                  value={soyad}
                  onChange={(e) => setSoyad(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gorev *</Label>
                <Select value={gorev} onValueChange={(v) => setGorev(v || "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Secin" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOREV_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  placeholder="Orn: 0532 123 4567"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Maas (TL)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={maas}
                  onChange={(e) => setMaas(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Ise Baslama Tarihi</Label>
                <Input
                  type="date"
                  value={iseBaslama}
                  onChange={(e) => setIseBaslama(e.target.value)}
                />
              </div>
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
                ? (t.common?.saving || "Kaydediliyor...")
                : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary Records Dialog */}
      <Dialog open={maasDialogOpen} onOpenChange={(open) => { if (!open) { setMaasDialogOpen(false); setSelectedPersonel(null); setMaaslar([]); resetMaasForm(); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Maas Kayitlari - {selectedPersonel?.ad} {selectedPersonel?.soyad}
            </DialogTitle>
          </DialogHeader>

          {/* Add Salary Form */}
          {canManage && (
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-medium">Yeni Maas Kaydi</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ay *</Label>
                  <Select value={maasAy} onValueChange={(v) => setMaasAy(v || "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Ay secin" />
                    </SelectTrigger>
                    <SelectContent>
                      {AY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Yil *</Label>
                  <Input
                    type="number"
                    placeholder="2026"
                    value={maasYil}
                    onChange={(e) => setMaasYil(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brut Maas *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={maasBrut}
                    onChange={(e) => setMaasBrut(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Net Maas *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={maasNet}
                    onChange={(e) => setMaasNet(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SGK Primi</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={maasSgk}
                    onChange={(e) => setMaasSgk(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vergi</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={maasVergi}
                    onChange={(e) => setMaasVergi(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Not</Label>
                <Input
                  placeholder="Ek bilgi veya aciklama"
                  value={maasNot}
                  onChange={(e) => setMaasNot(e.target.value)}
                />
              </div>
              <Button onClick={handleMaasSubmit} disabled={maasSubmitting}>
                {maasSubmitting ? "Kaydediliyor..." : "Maas Kaydi Ekle"}
              </Button>
            </div>
          )}

          {/* Salary Records List */}
          <div className="space-y-3">
            <h3 className="font-medium">Kayitlar</h3>
            {maasLoading ? (
              <p className="text-sm text-muted-foreground">{t.common.loading}</p>
            ) : maaslar.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henuz maas kaydi yok</p>
            ) : (
              maaslar.map((m) => (
                <Card key={m.id}>
                  <CardContent className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {getAyLabel(m.ay)} {m.yil}
                      </span>
                      <Badge
                        className={
                          m.odendi
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }
                      >
                        {m.odendi ? "Odendi" : "Odenmedi"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground grid grid-cols-2 gap-1">
                      <span>Brut: {parseFloat(m.brutMaas).toLocaleString("tr-TR")} TL</span>
                      <span>Net: {parseFloat(m.netMaas).toLocaleString("tr-TR")} TL</span>
                      {m.sgkPrim && (
                        <span>SGK: {parseFloat(m.sgkPrim).toLocaleString("tr-TR")} TL</span>
                      )}
                      {m.vergi && (
                        <span>Vergi: {parseFloat(m.vergi).toLocaleString("tr-TR")} TL</span>
                      )}
                    </div>
                    {m.not && (
                      <p className="text-sm text-muted-foreground">Not: {m.not}</p>
                    )}
                    {m.odenmeTarihi && (
                      <p className="text-sm text-muted-foreground">
                        Odenme Tarihi: {new Date(m.odenmeTarihi).toLocaleDateString("tr-TR")}
                      </p>
                    )}
                    {!m.odendi && canManage && (
                      <div className="pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkPaid(m.id)}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Odendi Isaretle
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
