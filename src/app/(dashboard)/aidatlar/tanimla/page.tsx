"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

export default function AidatTanimlaPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [ay, setAy] = useState(new Date().getMonth() + 1);
  const [yil, setYil] = useState(new Date().getFullYear());
  const [tutarKisi, setTutarKisi] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [sonOdemeTarihi, setSonOdemeTarihi] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const ayIsimleri = [
    t.months[1], t.months[2], t.months[3], t.months[4], t.months[5], t.months[6],
    t.months[7], t.months[8], t.months[9], t.months[10], t.months[11], t.months[12],
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutarKisi || !sonOdemeTarihi) {
      setError(t.common.required);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/aidatlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ay,
          yil,
          tutarKisi: parseFloat(tutarKisi),
          aciklama: aciklama || undefined,
          sonOdemeTarihi,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.errors) {
          setError(t.errors.generic);
        } else {
          setError(data.error || t.errors.generic);
        }
        return;
      }

      router.push("/aidatlar");
    } catch {
      setError(t.errors.generic);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/aidatlar">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t.dues.defineNew}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t.dues.allApartments}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            {t.dues.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.common.date}</label>
                <select
                  value={ay}
                  onChange={(e) => setAy(parseInt(e.target.value))}
                  className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {ayIsimleri.map((ayAdi, i) => (
                    <option key={i} value={i + 1}>{ayAdi}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.reports.title}</label>
                <input
                  type="number"
                  value={yil}
                  onChange={(e) => setYil(parseInt(e.target.value))}
                  className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  min={2020}
                  max={2100}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t.dues.perPerson} (₺)</label>
              <input
                type="number"
                value={tutarKisi}
                onChange={(e) => setTutarKisi(e.target.value)}
                placeholder="1500"
                step="0.01"
                className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t.dues.deadline}</label>
              <input
                type="date"
                value={sonOdemeTarihi}
                onChange={(e) => setSonOdemeTarihi(e.target.value)}
                className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t.common.description} ({t.common.optional})</label>
              <textarea
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                rows={2}
                placeholder={t.dues.paymentNote}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? t.common.processing : t.dues.defineNew}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
