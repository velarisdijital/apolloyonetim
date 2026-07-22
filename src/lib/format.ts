import { format } from "date-fns";
import { tr } from "date-fns/locale";

export function formatTarih(date: Date | string): string {
  return format(new Date(date), "d MMMM yyyy", { locale: tr });
}

export function formatTarihKisa(date: Date | string): string {
  return format(new Date(date), "dd.MM.yyyy", { locale: tr });
}

export function formatPara(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(num);
}

export function formatAy(ay: number, yil: number): string {
  const date = new Date(yil, ay - 1, 1);
  return format(date, "MMMM yyyy", { locale: tr });
}
