"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Clock,
  Plus,
  Trash2,
  User,
} from "lucide-react";

interface Reservation {
  id: string;
  tarih: string;
  baslangicSaati: number;
  bitisSaati: number;
  aciklama: string | null;
  userId: string;
  user: { id: string; ad: string; soyad: string };
}

const GUN_ADLARI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const AY_ADLARI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function RezervasyonlarPage() {
  const { data: session } = useSession();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [baslangic, setBaslangic] = useState("10");
  const [sure, setSure] = useState("2");
  const [aciklama, setAciklama] = useState("");

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/rezervasyonlar?ay=${currentMonth + 1}&yil=${currentYear}`
      );
      if (res.ok) {
        setReservations(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const reservationsByDate = reservations.reduce<Record<string, Reservation[]>>(
    (acc, r) => {
      const key = r.tarih.split("T")[0];
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    },
    {}
  );

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const today = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());

  const handleCreateReservation = async () => {
    if (!selectedDate) return;
    setSubmitting(true);
    setError(null);

    const baslangicSaati = Number(baslangic);
    const bitisSaati = baslangicSaati + Number(sure);

    try {
      const res = await fetch("/api/rezervasyonlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tarih: selectedDate,
          baslangicSaati,
          bitisSaati,
          aciklama: aciklama || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Rezervasyon oluşturulamadı");
      }

      setDialogOpen(false);
      setAciklama("");
      setBaslangic("10");
      setSure("2");
      await fetchReservations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/rezervasyonlar?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchReservations();
      }
    } catch {
      // ignore
    }
  };

  const openNewReservation = (dateKey: string) => {
    setSelectedDate(dateKey);
    setError(null);
    setDialogOpen(true);
  };

  const selectedDateReservations = selectedDate
    ? reservationsByDate[selectedDate] || []
    : [];

  const saatSecenekleri = Array.from({ length: 22 }, (_, i) => i);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Flame className="h-6 w-6 text-orange-500" />
          Barbekü Alanı Rezervasyonu
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Her gün 22:00&apos;ye kadar açık &middot; Maksimum 3 saat &middot; Tek kişi
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-lg">
              {AY_ADLARI[currentMonth]} {currentYear}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {GUN_ADLARI.map((gun) => (
              <div
                key={gun}
                className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
              >
                {gun}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = formatDateKey(currentYear, currentMonth, day);
              const dayReservations = reservationsByDate[dateKey] || [];
              const isToday = dateKey === today;
              const isPast = dateKey < today;

              return (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedDate(dateKey);
                    setDialogOpen(false);
                  }}
                  disabled={isPast}
                  className={`
                    aspect-square rounded-lg text-sm flex flex-col items-center justify-center gap-0.5 transition-colors relative
                    ${isToday ? "ring-2 ring-blue-500 font-bold" : ""}
                    ${selectedDate === dateKey ? "bg-blue-100 dark:bg-blue-900" : ""}
                    ${isPast ? "text-gray-300 dark:text-gray-600 cursor-not-allowed" : "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"}
                  `}
                >
                  <span>{day}</span>
                  {dayReservations.length > 0 && (
                    <div className="flex gap-0.5">
                      {dayReservations.slice(0, 3).map((_, idx) => (
                        <div
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full bg-orange-500"
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("tr-TR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </CardTitle>
              {selectedDate >= today && (
                <Button
                  size="sm"
                  onClick={() => openNewReservation(selectedDate)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Rezervasyon Yap
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500 text-sm">Yükleniyor...</p>
            ) : selectedDateReservations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Flame className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Bu gün için rezervasyon yok</p>
                {selectedDate >= today && (
                  <p className="text-sm mt-1">
                    Barbekü alanını rezerve etmek için yukarıdaki butona tıklayın
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateReservations.map((rez) => (
                  <div
                    key={rez.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                        <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            {String(rez.baslangicSaati).padStart(2, "0")}:00 - {String(rez.bitisSaati).padStart(2, "0")}:00
                          </Badge>
                          <span className="text-sm font-medium flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {rez.user.ad} {rez.user.soyad}
                          </span>
                        </div>
                        {rez.aciklama && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {rez.aciklama}
                          </p>
                        )}
                      </div>
                    </div>
                    {(rez.userId === session?.user?.id || ["MASTER_ADMIN", "KAPICI"].includes(session?.user?.rol || "")) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDelete(rez.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Yeni Rezervasyon
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              {selectedDate &&
                new Date(selectedDate + "T12:00:00").toLocaleDateString("tr-TR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
            </div>

            <div className="space-y-2">
              <Label>Başlangıç Saati</Label>
              <Select value={baslangic} onValueChange={(v) => v && setBaslangic(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {saatSecenekleri.map((saat) => (
                    <SelectItem key={saat} value={String(saat)}>
                      {String(saat).padStart(2, "0")}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Süre</Label>
              <Select value={sure} onValueChange={(v) => v && setSure(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Saat</SelectItem>
                  <SelectItem value="2">2 Saat</SelectItem>
                  <SelectItem value="3">3 Saat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-gray-500">
              {String(baslangic).padStart(2, "0")}:00 -{" "}
              {String(Number(baslangic) + Number(sure)).padStart(2, "0")}:00
            </div>

            <div className="space-y-2">
              <Label>Açıklama (opsiyonel)</Label>
              <Input
                placeholder="Örn: Doğum günü kutlaması"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleCreateReservation}
              disabled={submitting || Number(baslangic) + Number(sure) > 22}
            >
              {submitting ? "Kaydediliyor..." : "Rezervasyon Yap"}
            </Button>

            {Number(baslangic) + Number(sure) > 22 && (
              <p className="text-xs text-red-500 text-center">
                Barbekü alanı 22:00&apos;den sonra kullanılamaz
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
