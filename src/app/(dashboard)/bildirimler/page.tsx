"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Mail, MailOpen } from "lucide-react";

interface Bildirim {
  id: string;
  baslik: string;
  mesaj: string;
  okundu: boolean;
  tip: string;
  link: string | null;
  createdAt: string;
}

function zamanFarkiHesapla(tarih: string): string {
  const simdi = new Date();
  const bildirimTarihi = new Date(tarih);
  const farkMs = simdi.getTime() - bildirimTarihi.getTime();
  const farkSaat = Math.floor(farkMs / (1000 * 60 * 60));
  const farkGun = Math.floor(farkMs / (1000 * 60 * 60 * 24));

  if (farkSaat < 1) return "az önce";
  if (farkSaat < 24) return `${farkSaat} saat önce`;
  return `${farkGun} gün önce`;
}

function tipRengi(tip: string): string {
  switch (tip.toLowerCase()) {
    case "aidat":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "duyuru":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "ariza":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "toplanti":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

export default function BildirimlerPage() {
  const router = useRouter();
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const okunmamisSayisi = bildirimler.filter((b) => !b.okundu).length;

  useEffect(() => {
    bildirimleriGetir();
  }, []);

  async function bildirimleriGetir() {
    try {
      setYukleniyor(true);
      const res = await fetch("/api/bildirimler");
      if (res.ok) {
        const data = await res.json();
        setBildirimler(data);
      }
    } catch (error) {
      console.error("Bildirimler yüklenirken hata:", error);
    } finally {
      setYukleniyor(false);
    }
  }

  async function okunduIsaretle(id: string) {
    try {
      await fetch("/api/bildirimler", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setBildirimler((onceki) =>
        onceki.map((b) => (b.id === id ? { ...b, okundu: true } : b))
      );
    } catch (error) {
      console.error("Bildirim okundu işaretlenirken hata:", error);
    }
  }

  async function tumunuOkunduIsaretle() {
    try {
      await fetch("/api/bildirimler", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tumunu: true }),
      });
      setBildirimler((onceki) =>
        onceki.map((b) => ({ ...b, okundu: true }))
      );
    } catch (error) {
      console.error("Tümü okundu işaretlenirken hata:", error);
    }
  }

  async function bildirimTiklandi(bildirim: Bildirim) {
    if (!bildirim.okundu) {
      await okunduIsaretle(bildirim.id);
    }
    if (bildirim.link) {
      router.push(bildirim.link);
    }
  }

  if (yukleniyor) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bildirimler</h1>
          <p className="text-muted-foreground">Bildirimleriniz</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Bildirimler</h1>
            {okunmamisSayisi > 0 && (
              <Badge variant="destructive">{okunmamisSayisi}</Badge>
            )}
          </div>
          <p className="text-muted-foreground">Bildirimleriniz</p>
        </div>
        {okunmamisSayisi > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={tumunuOkunduIsaretle}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Tümünü Okundu İşaretle
          </Button>
        )}
      </div>

      {bildirimler.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              Bildiriminiz bulunmuyor
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bildirimler.map((bildirim) => (
            <Card
              key={bildirim.id}
              onClick={() => bildirimTiklandi(bildirim)}
              className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                !bildirim.okundu
                  ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200"
                  : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {bildirim.okundu ? (
                      <MailOpen className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Mail className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-sm ${
                          !bildirim.okundu ? "font-bold" : "font-medium"
                        }`}
                      >
                        {bildirim.baslik}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${tipRengi(
                          bildirim.tip
                        )}`}
                      >
                        {bildirim.tip}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {bildirim.mesaj}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {zamanFarkiHesapla(bildirim.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
