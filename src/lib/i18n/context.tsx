"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { tr, loadTranslations, getStoredLocale, setStoredLocale } from "./index";
import type { TranslationKeys } from "./translations/tr";
import type { Locale } from "./types";
import { LOCALES } from "./types";

interface I18nContextType {
  locale: Locale;
  t: TranslationKeys;
  setLocale: (locale: Locale) => void;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextType>({
  locale: "tr",
  t: tr,
  setLocale: () => {},
  dir: "ltr",
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("tr");
  const [translations, setTranslations] = useState<TranslationKeys>(tr);
  const { data: session } = useSession();

  // On mount: use localStorage for instant load, then hydrate from session (DB) as source of truth
  useEffect(() => {
    const stored = getStoredLocale();
    if (stored !== "tr") {
      setLocaleState(stored);
      loadTranslations(stored).then(setTranslations);
    }
  }, []);

  // When session loads, sync locale from DB (source of truth)
  useEffect(() => {
    const dbLocale = session?.user?.locale as Locale | undefined;
    if (dbLocale && dbLocale !== locale && dbLocale in LOCALES) {
      setLocaleState(dbLocale);
      setStoredLocale(dbLocale);
      loadTranslations(dbLocale).then(setTranslations);
      document.documentElement.lang = dbLocale;
      document.documentElement.dir = LOCALES[dbLocale].dir;
    }
  }, [session?.user?.locale]); // eslint-disable-line react-hooks/exhaustive-deps

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
    const t = await loadTranslations(newLocale);
    setTranslations(t);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = LOCALES[newLocale].dir;

    // Fire-and-forget: persist locale to DB via profile API
    fetch("/api/profil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: newLocale }),
    }).catch(() => {
      // Silently ignore - localStorage is the fallback cache
    });
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t: translations, setLocale, dir: LOCALES[locale].dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
