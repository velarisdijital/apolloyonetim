"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KATEGORI_LABELS } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GiderEklePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [aciklama, setAciklama] = useState("");
  const [tutar, setTutar] = useState("");
  const [kategori, setKategori] = useState("");
  const [tarih, setTarih] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [fisYolu, setFisYolu] = useState("");
  const [fisAdi, setFisAdi] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Dosya yuklenemedi");
        return;
      }

      const data = await res.json();
      setFisYolu(data.path);
      setFisAdi(data.originalName || file.name);
      toast.success("Dosya yuklendi");
    } catch {
      toast.error("Dosya yuklenirken bir hata olustu");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aciklama || !tutar || !kategori || !tarih) {
      toast.error("Lutfen tum zorunlu alanlari doldurun");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/giderler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aciklama,
          tutar: parseFloat(tutar),
          kategori,
          tarih,
          fisYolu: fisYolu || undefined,
          fisAdi: fisAdi || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Gider eklenemedi");
        return;
      }

      toast.success("Gider basariyla eklendi");
      router.push("/giderler");
      router.refresh();
    } catch {
      toast.error("Bir hata olustu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" render={<Link href="/giderler" />}>
            <ArrowLeft className="mr-1 size-4" />
            Geri
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gider Ekle</h1>
          <p className="text-muted-foreground">
            Yeni bir gider kaydi olusturun
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gider Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="aciklama">Aciklama *</Label>
              <Input
                id="aciklama"
                placeholder="Gider aciklamasini girin"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tutar">Tutar (TL) *</Label>
                <Input
                  id="tutar"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={tutar}
                  onChange={(e) => setTutar(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Kategori *</Label>
                <Select value={kategori} onValueChange={(v) => v && setKategori(v)} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Kategori secin" />
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tarih">Tarih *</Label>
              <Input
                id="tarih"
                type="date"
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fis">Fis Yukle</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="fis"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="file:mr-2 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary"
                />
                {uploading && (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {fisAdi && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Yuklenen: {fisAdi}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP veya PDF. Maks. 5MB.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" render={<Link href="/giderler" />}>
                Iptal
              </Button>
              <Button type="submit" disabled={loading || uploading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Gider Ekle
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
