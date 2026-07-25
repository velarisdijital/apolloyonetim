"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { formatTarihKisa, formatPara } from "@/lib/format";
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
import { useTranslation } from "@/lib/i18n/context";

interface Gider {
  id: string;
  kategori: string;
  aciklama: string;
  tutar: number;
  tarih: string;
  fisYolu: string | null;
  fisAdi: string | null;
  onayDurumu: string;
  createdBy: { ad: string; soyad: string };
}

export default function GiderlerPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [giderler, setGiderler] = useState<Gider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGiderler = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const kategori = searchParams.get("kategori");
      const baslangic = searchParams.get("baslangic");
      const bitis = searchParams.get("bitis");
      if (kategori && kategori !== "TUMU") params.set("kategori", kategori);
      if (baslangic) params.set("baslangic", baslangic);
      if (bitis) params.set("bitis", bitis);
      const res = await fetch(`/api/giderler?${params.toString()}`);
      if (res.ok) setGiderler(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchGiderler();
  }, [fetchGiderler]);

  const canAdd = session?.user?.rol && ["MASTER_ADMIN", "KAPICI"].includes(session.user.rol);

  const categoryLabel = (kategori: string) => {
    return t.categories[kategori as keyof typeof t.categories] || kategori;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.expenses.title}</h1>
          <p className="text-muted-foreground">
            {t.expenses.subtitle}
          </p>
        </div>
        {canAdd && (
          <Button render={<Link href="/giderler/ekle" />}>
              <Plus className="mr-2 size-4" />
              {t.expenses.addExpense}
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
                <TableHead>{t.expenses.date}</TableHead>
                <TableHead>{t.expenses.category}</TableHead>
                <TableHead>{t.expenses.description}</TableHead>
                <TableHead className="text-right">{t.expenses.amount}</TableHead>
                <TableHead>{t.expenses.addedBy}</TableHead>
                <TableHead>{t.expenses.receipt}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {giderler.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    <Receipt className="mx-auto mb-2 size-8 opacity-50" />
                    {t.expenses.noExpenses}
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
                        {categoryLabel(gider.kategori)}
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
                          fisAdi={gider.fisAdi || t.expenses.receipt}
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
              {t.expenses.noExpenses}
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
                        {categoryLabel(gider.kategori)}
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
                        fisAdi={gider.fisAdi || t.expenses.receipt}
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
