import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatTarih } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Calendar } from "lucide-react";
import Link from "next/link";

export default async function ToplantilarPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.buildingId) {
    redirect("/select-building");
  }

  const toplantilar = await prisma.meeting.findMany({
    where: { buildingId: session.user.buildingId },
    orderBy: { tarih: "desc" },
    include: {
      createdBy: {
        select: { ad: true, soyad: true },
      },
    },
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Toplantılar</h1>
          <p className="text-muted-foreground">Bina toplantı kayıtları</p>
        </div>
        {session.user.rol === "MASTER_ADMIN" && (
          <Link href="/toplantilar/ekle">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Toplantı
            </Button>
          </Link>
        )}
      </div>

      {toplantilar.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Henüz toplantı kaydı yok
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
                            Yaklaşan
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatTarih(toplanti.tarih)}
                        </span>
                        <span>
                          Oluşturan: {toplanti.createdBy.ad} {toplanti.createdBy.soyad}
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
                      Devamını Oku
                    </Link>
                  )}
                  {toplanti.katilimcilar && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground pt-2 border-t">
                      <Users className="h-3.5 w-3.5" />
                      <span>Katılımcılar: {toplanti.katilimcilar}</span>
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
