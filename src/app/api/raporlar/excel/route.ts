import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

// Muhasebe devir için Excel dışa aktarım: Giderler + Aidat durumu (bina kapsamlı).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!["MASTER_ADMIN", "DENETCI"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }
  const buildingId = session.user.buildingId!;

  const [expenses, duesList] = await Promise.all([
    prisma.expense.findMany({ where: { buildingId }, orderBy: { tarih: "desc" } }),
    prisma.dues.findMany({
      where: { buildingId },
      orderBy: [{ yil: "desc" }, { ay: "desc" }],
      include: { items: { include: { apartment: { select: { no: true } } } } },
    }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Apollo";

  const gider = wb.addWorksheet("Giderler");
  gider.columns = [
    { header: "Tarih", key: "tarih", width: 14 },
    { header: "Kategori", key: "kategori", width: 18 },
    { header: "Açıklama", key: "aciklama", width: 40 },
    { header: "Tutar (₺)", key: "tutar", width: 14 },
    { header: "Onay", key: "onay", width: 14 },
  ];
  gider.getRow(1).font = { bold: true };
  for (const e of expenses) {
    gider.addRow({
      tarih: e.tarih.toLocaleDateString("tr-TR"),
      kategori: e.kategori,
      aciklama: e.aciklama,
      tutar: Number(e.tutar),
      onay: e.onayDurumu,
    });
  }
  gider.getColumn("tutar").numFmt = "#,##0.00";

  const aidat = wb.addWorksheet("Aidatlar");
  aidat.columns = [
    { header: "Dönem", key: "donem", width: 12 },
    { header: "Daire", key: "daire", width: 12 },
    { header: "Tutar (₺)", key: "tutar", width: 14 },
    { header: "Durum", key: "durum", width: 16 },
  ];
  aidat.getRow(1).font = { bold: true };
  for (const d of duesList) {
    for (const it of d.items) {
      aidat.addRow({
        donem: `${String(d.ay).padStart(2, "0")}/${d.yil}`,
        daire: it.apartment.no,
        tutar: Number(d.tutarKisi),
        durum: it.durum,
      });
    }
  }
  aidat.getColumn("tutar").numFmt = "#,##0.00";

  const buf = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(Buffer.from(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="apollo-rapor-${stamp}.xlsx"`,
    },
  });
}
