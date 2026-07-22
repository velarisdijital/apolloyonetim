import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatTarih } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Megaphone, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function DuyurularPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.buildingId) {
    redirect("/");
  }

  const duyurular = await prisma.announcement.findMany({
    where: {
      buildingId: session.user.buildingId,
    },
    orderBy: [
      { onemli: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      createdBy: {
        select: {
          ad: true,
          soyad: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Duyurular</h1>
          <p className="text-muted-foreground">
            Bina duyuruları ve bilgilendirmeler
          </p>
        </div>
        {session.user.rol === "MASTER_ADMIN" && (
          <Link href="/duyurular/ekle">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Duyuru
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
              Henüz duyuru yok
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
                    <Badge variant="destructive">Önemli</Badge>
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
