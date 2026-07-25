"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Lock, Globe } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";
import { LOCALES, type Locale } from "@/lib/i18n/types";

const LOCALE_ORDER: Locale[] = ["tr", "en", "ru", "uk", "pl", "de", "fr", "ka", "ar"];

export default function AyarlarPage() {
  const { data: session, status } = useSession();
  const { locale, setLocale, t } = useTranslation();

  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [telefon, setTelefon] = useState("");

  const [mevcutSifre, setMevcutSifre] = useState("");
  const [yeniSifre, setYeniSifre] = useState("");
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState("");

  const [profilYukleniyor, setProfilYukleniyor] = useState(false);
  const [sifreYukleniyor, setSifreYukleniyor] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Pre-fill form fields from session data once loaded
  if (status === "authenticated" && session?.user && !initialized) {
    setAd(session.user.ad ?? "");
    setSoyad(session.user.soyad ?? "");
    setInitialized(true);
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const handleProfilKaydet = async () => {
    setProfilYukleniyor(true);
    try {
      const res = await fetch("/api/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad, soyad, telefon }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.settings.profileUpdateError);
        return;
      }
      toast.success(t.settings.profileUpdated);
    } catch {
      toast.error(t.errors.generic);
    } finally {
      setProfilYukleniyor(false);
    }
  };

  const handleSifreGuncelle = async () => {
    if (yeniSifre !== yeniSifreTekrar) {
      toast.error(t.settings.passwordMismatch);
      return;
    }
    setSifreYukleniyor(true);
    try {
      const res = await fetch("/api/sifre", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mevcutSifre, yeniSifre, yeniSifreTekrar }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.settings.passwordUpdateError);
        return;
      }
      toast.success(t.settings.passwordUpdated);
      setMevcutSifre("");
      setYeniSifre("");
      setYeniSifreTekrar("");
    } catch {
      toast.error(t.errors.generic);
    } finally {
      setSifreYukleniyor(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          {t.settings.title}
        </h1>
        <p className="text-muted-foreground">{t.settings.subtitle}</p>
      </div>

      {/* Profil Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t.settings.profileInfo}
          </CardTitle>
          <CardDescription>
            {t.settings.profileSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ad">{t.settings.name}</Label>
              <Input
                id="ad"
                value={ad}
                onChange={(e) => setAd(e.target.value)}
                placeholder={t.settings.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soyad">{t.settings.surname}</Label>
              <Input
                id="soyad"
                value={soyad}
                onChange={(e) => setSoyad(e.target.value)}
                placeholder={t.settings.surname}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefon">{t.settings.phone}</Label>
            <Input
              id="telefon"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              placeholder={t.settings.phonePlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t.settings.email}</Label>
            <Input
              id="email"
              value={session?.user?.email ?? ""}
              disabled
              readOnly
              className="bg-muted cursor-not-allowed"
            />
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleProfilKaydet} disabled={profilYukleniyor}>
              {profilYukleniyor ? t.common.saving : t.common.save}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Şifre Değiştir */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t.settings.changePassword}
          </CardTitle>
          <CardDescription>
            {t.settings.changePasswordSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mevcutSifre">{t.settings.currentPassword}</Label>
            <Input
              id="mevcutSifre"
              type="password"
              value={mevcutSifre}
              onChange={(e) => setMevcutSifre(e.target.value)}
              placeholder={t.settings.currentPasswordPlaceholder}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yeniSifre">{t.settings.newPassword}</Label>
              <Input
                id="yeniSifre"
                type="password"
                value={yeniSifre}
                onChange={(e) => setYeniSifre(e.target.value)}
                placeholder={t.settings.newPasswordPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yeniSifreTekrar">{t.settings.confirmPassword}</Label>
              <Input
                id="yeniSifreTekrar"
                type="password"
                value={yeniSifreTekrar}
                onChange={(e) => setYeniSifreTekrar(e.target.value)}
                placeholder={t.settings.confirmPasswordPlaceholder}
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSifreGuncelle} disabled={sifreYukleniyor}>
              {sifreYukleniyor ? t.common.processing : t.settings.updatePassword}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dil Seçimi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t.settings.language}
          </CardTitle>
          <CardDescription>
            {t.settings.languageSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {LOCALE_ORDER.map((code) => {
              const info = LOCALES[code];
              const isActive = locale === code;
              return (
                <button
                  key={code}
                  onClick={() => setLocale(code)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    isActive
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950 ring-1 ring-blue-500"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="text-xl">{info.flag}</span>
                  <div>
                    <p className={`text-sm font-medium ${isActive ? "text-blue-700 dark:text-blue-300" : ""}`}>
                      {info.nativeName}
                    </p>
                    <p className="text-xs text-gray-500">{info.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
