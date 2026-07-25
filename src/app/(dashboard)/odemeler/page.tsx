"use client";

import { useEffect, useState } from "react";
import { formatPara, formatTarihKisa, formatAy } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Banknote } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface Payment {
  id: string;
  tutar: number;
  tarih: string;
  aciklama: string | null;
  apartment: { id: string; no: string; kat: number };
  duesItem: {
    dues: { ay: number; yil: number; tutarKisi: number };
  };
  user: { id: string; ad: string; soyad: string };
}

export default function OdemelerPage() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch("/api/odemeler");
        if (res.ok) setPayments(await res.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const thisMonthPayments = payments.filter((p) => {
    const d = new Date(p.tarih);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const thisMonthTotal = thisMonthPayments.reduce(
    (sum, p) => sum + Number(p.tutar),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.payments.title}</h1>
        <p className="text-muted-foreground">{t.payments.subtitle}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t.common.total}</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPara(thisMonthTotal)}</div>
          <p className="text-xs text-muted-foreground">
            {thisMonthPayments.length} {t.payments.title.toLowerCase()}
          </p>
        </CardContent>
      </Card>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t.payments.noPayments}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.common.date}</TableHead>
                    <TableHead>{t.dues.apartment}</TableHead>
                    <TableHead>{t.common.amount}</TableHead>
                    <TableHead>{t.payments.paymentDate}</TableHead>
                    <TableHead>{t.common.description}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatTarihKisa(payment.tarih)}</TableCell>
                      <TableCell>{t.dues.apartment} {payment.apartment.no}</TableCell>
                      <TableCell>{formatPara(Number(payment.tutar))}</TableCell>
                      <TableCell>
                        {formatAy(
                          payment.duesItem.dues.ay,
                          payment.duesItem.dues.yil
                        )}
                      </TableCell>
                      <TableCell>{payment.aciklama || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
