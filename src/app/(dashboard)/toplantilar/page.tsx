"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { formatTarih } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Calendar } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

interface Toplanti {
  id: string;
  baslik: string;
  tarih: string;
  icerik: string;
  katilimcilar: string | null;
  createdBy: { ad: string; soyad: string };
}

export default function ToplantilarPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [toplantilar, setToplantilar] = useState<Toplanti[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToplantilar = async () => {
      try {
        const res = await fetch("/api/toplantilar");
        if (res.ok) {
          const data = await res.json();
          setToplantilar(data);
        }
      } catch (error) {
        console.error("Toplantılar yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchToplantilar();
  }, []);

  const userRole = (session?.user as { rol?: string })?.rol;
  const now = new Date();

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
          <h1 className="text-3xl font-bold tracking-tight">{t.meetings.title}</h1>
          <p className="text-muted-foreground">{t.meetings.subtitle}</p>
        </div>
        {userRole === "MASTER_ADMIN" && (
          <Link href="/toplantilar/ekle">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t.meetings.addNew}
            </Button>
          </Link>
        )}
      </div>

      {toplantilar.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {t.meetings.noMeetings}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {toplantilar.map((toplanti) => {
            const isFuture = new Date(toplanti.tarih) > now;

            return (
              <Card key={toplanti.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {toplanti.baslik}
                        {isFuture && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {t.meetings.upcoming}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatTarih(toplanti.tarih)}
                        </span>
                        <span>
                          {toplanti.createdBy.ad} {toplanti.createdBy.soyad}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">
                    {toplanti.icerik}
                  </p>
                  {toplanti.icerik.length > 200 && (
                    <Link
                      href={`/toplantilar/${toplanti.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {t.common.view}
                    </Link>
                  )}
                  {toplanti.katilimcilar && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground pt-2 border-t">
                      <Users className="h-3.5 w-3.5" />
                      <span>{t.meetings.participants}: {toplanti.katilimcilar}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
