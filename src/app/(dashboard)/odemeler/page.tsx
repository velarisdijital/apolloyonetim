import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatPara, formatTarihKisa, formatAy } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Banknote } from "lucide-react";

export default async function OdemelerPage() {
  const session = await getServerSession(authOptions);
  const buildingId = session?.user?.buildingId;

  if (!buildingId) {
    redirect("/giris");
  }

  const payments = await prisma.payment.findMany({
    where: {
      duesItem: {
        dues: {
          buildingId,
        },
      },
    },
    include: {
      apartment: true,
      duesItem: {
        include: {
          dues: true,
        },
      },
      user: true,
    },
    orderBy: {
      tarih: "desc",
    },
  });

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ödemeler</h1>
        <p className="text-muted-foreground">Aidat ödemeleri listesi</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bu Ay Toplanan</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPara(thisMonthTotal)}</div>
          <p className="text-xs text-muted-foreground">
            {thisMonthPayments.length} ödeme
          </p>
        </CardContent>
      </Card>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Henüz ödeme kaydı yok</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Daire</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Aidat Dönemi</TableHead>
                    <TableHead>Açıklama</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatTarihKisa(payment.tarih)}</TableCell>
                      <TableCell>Daire {payment.apartment.no}</TableCell>
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
