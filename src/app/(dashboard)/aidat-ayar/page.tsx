"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, DollarSign, Calendar, Percent, Save } from "lucide-react";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function AidatAyarPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tutarKisi, setTutarKisi] = useState("");
  const [metrekareGoreDagit, setMetrekareGoreDagit] = useState(false);
  const [gecikmeFaiziOrani, setGecikmeFaiziOrani] = useState("5");
  const [sonOdemeGunu, setSonOdemeGunu] = useState("15");
  const [otomatikOlustur, setOtomatikOlustur] = useState(false);
  const [aciklama, setAciklama] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/aidat-ayar")
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setTutarKisi(data.tutarKisi?.toString() || "");
            setMetrekareGoreDagit(data.metrekareGoreDagit || false);
            setGecikmeFaiziOrani(data.gecikmeFaiziOrani?.toString() || "5");
            setSonOdemeGunu(data.sonOdemeGunu?.toString() || "15");
            setOtomatikOlustur(data.otomatikOlustur || false);
            setAciklama(data.aciklama || "");
          }
        })
        .catch(() => {
          toast.error("Ayarlar yuklenirken hata olustu");
        })
        .finally(() => setLoading(false));
    }
  }, [status]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/aidat-ayar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutarKisi,
          metrekareGoreDagit,
          gecikmeFaiziOrani,
          sonOdemeGunu: parseInt(sonOdemeGunu) || 15,
          otomatikOlustur,
          aciklama,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Kaydetme sirasinda hata olustu");
        return;
      }

      toast.success("Aidat ayarlari basariyla kaydedildi");
    } catch {
      toast.error("Kaydetme sirasinda hata olustu");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session || (session.user as any).rol !== "MASTER_ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Bu sayfaya erisim yetkiniz yok
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aidat Ayarlari</h1>
          <p className="text-muted-foreground">
            Aidat tutari, gecikme faizi ve otomatik olusturma ayarlarini yapilandirin
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Aidat Tutari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tutarKisi">Kisi Basi Aidat Tutari (TL)</Label>
              <Input
                id="tutarKisi"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={tutarKisi}
                onChange={(e) => setTutarKisi(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Metrekareye Gore Dagitim</Label>
                <p className="text-sm text-muted-foreground">
                  Aidat tutarini daire metrekaresine gore dagit
                </p>
              </div>
              <Toggle
                checked={metrekareGoreDagit}
                onChange={setMetrekareGoreDagit}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Gecikme Faizi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gecikmeFaiziOrani">Gecikme Faizi Orani (%)</Label>
              <Input
                id="gecikmeFaiziOrani"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="5.00"
                value={gecikmeFaiziOrani}
                onChange={(e) => setGecikmeFaiziOrani(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Odeme Takvimi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sonOdemeGunu">Son Odeme Gunu (1-28)</Label>
              <Input
                id="sonOdemeGunu"
                type="number"
                min="1"
                max="28"
                placeholder="15"
                value={sonOdemeGunu}
                onChange={(e) => setSonOdemeGunu(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Otomatik Aidat Olustur</Label>
                <p className="text-sm text-muted-foreground">
                  Her ay otomatik olarak aidat kaydi olustur
                </p>
              </div>
              <Toggle
                checked={otomatikOlustur}
                onChange={setOtomatikOlustur}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Ek Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aciklama">Aciklama</Label>
              <Textarea
                id="aciklama"
                placeholder="Aidat ile ilgili ek aciklama..."
                rows={4}
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Kaydediliyor..." : "Ayarlari Kaydet"}
        </Button>
      </div>
    </div>
  );
}
