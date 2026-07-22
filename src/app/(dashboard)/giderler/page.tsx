import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatTarihKisa, formatPara } from "@/lib/format";
import { KATEGORI_LABELS } from "@/lib/constants";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Receipt } from "lucide-react";
import Link from "next/link";
import { GiderFilters } from "./filters";
import { ReceiptViewer } from "@/components/giderler/receipt-viewer";

interface PageProps {
  searchParams: Promise<{
    kategori?: string;
    baslangic?: string;
    bitis?: string;
  }>;
}

export default async function GiderlerPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.buildingId) redirect("/giris");

  const params = await searchParams;
  const { kategori, baslangic, bitis } = params;

  const where: Record<string, unknown> = {
    buildingId: session.user.buildingId,
  };
  if (kategori && kategori !== "TUMU") where.kategori = kategori;
  if (baslangic && bitis) {
    where.tarih = { gte: new Date(baslangic), lte: new Date(bitis) };
  }

  if (!["MASTER_ADMIN", "DENETCI"].includes(session.user.rol)) {
    where.onayDurumu = "ONAYLANDI";
  }

  const giderler = await prisma.expense.findMany({
    where,
    orderBy: { tarih: "desc" },
    include: { createdBy: { select: { ad: true, soyad: true } } },
  });

  const canAdd = ["MASTER_ADMIN", "KAPICI"].includes(session.user.rol);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Giderler</h1>
          <p className="text-muted-foreground">
            Bina giderlerini görüntüleyin ve yönetin
          </p>
        </div>
        {canAdd && (
          <Button render={<Link href="/giderler/ekle" />}>
              <Plus className="mr-2 size-4" />
              Gider Ekle
          </Button>
        )}
      </div>

      <GiderFilters />

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead>Ekleyen</TableHead>
                <TableHead>Fis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {giderler.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    <Receipt className="mx-auto mb-2 size-8 opacity-50" />
                    Kayıtlı gider bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                giderler.map((gider) => (
                  <TableRow key={gider.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatTarihKisa(gider.tarih)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {KATEGORI_LABELS[gider.kategori] || gider.kategori}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {gider.aciklama}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium">
                      {formatPara(Number(gider.tutar))}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {gider.createdBy.ad} {gider.createdBy.soyad}
                    </TableCell>
                    <TableCell>
                      {gider.fisYolu ? (
                        <ReceiptViewer
                          fisYolu={gider.fisYolu}
                          fisAdi={gider.fisAdi || "Fis"}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {giderler.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-8 text-muted-foreground">
              <Receipt className="mb-2 size-8 opacity-50" />
              Kayıtlı gider bulunamadı
            </CardContent>
          </Card>
        ) : (
          giderler.map((gider) => (
            <Card key={gider.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="shrink-0">
                        {KATEGORI_LABELS[gider.kategori] || gider.kategori}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTarihKisa(gider.tarih)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium">
                      {gider.aciklama}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {gider.createdBy.ad} {gider.createdBy.soyad}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold">
                      {formatPara(Number(gider.tutar))}
                    </span>
                    {gider.fisYolu && (
                      <ReceiptViewer
                        fisYolu={gider.fisYolu}
                        fisAdi={gider.fisAdi || "Fis"}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
