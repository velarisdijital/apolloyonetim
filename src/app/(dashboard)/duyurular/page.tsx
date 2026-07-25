"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { formatTarih } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Megaphone, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

interface Duyuru {
  id: string;
  baslik: string;
  icerik: string;
  onemli: boolean;
  createdAt: string;
  createdBy: { ad: string; soyad: string };
}

export default function DuyurularPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [duyurular, setDuyurular] = useState<Duyuru[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDuyurular = async () => {
      try {
        const res = await fetch("/api/duyurular");
        if (res.ok) {
          const data = await res.json();
          setDuyurular(data);
        }
      } catch (error) {
        console.error("Duyurular yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDuyurular();
  }, []);

  const userRole = (session?.user as { rol?: string })?.rol;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.announcements.title}</h1>
          <p className="text-muted-foreground">
            {t.announcements.subtitle}
          </p>
        </div>
        {userRole === "MASTER_ADMIN" && (
          <Link href="/duyurular/ekle">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t.announcements.addNew}
            </Button>
          </Link>
        )}
      </div>

      <Separator />

      {duyurular.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {t.announcements.noAnnouncements}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {duyurular.map((duyuru) => (
            <Card
              key={duyuru.id}
              className={
                duyuru.onemli
                  ? "border-red-200 dark:border-red-900"
                  : ""
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {duyuru.onemli && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    {duyuru.baslik}
                  </CardTitle>
                  {duyuru.onemli && (
                    <Badge variant="destructive">{t.announcements.important}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {duyuru.createdBy.ad} {duyuru.createdBy.soyad}
                  </span>
                  <span>·</span>
                  <span>{formatTarih(duyuru.createdAt)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{duyuru.icerik}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
