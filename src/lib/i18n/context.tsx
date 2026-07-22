"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
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

  useEffect(() => {
    const stored = getStoredLocale();
    if (stored !== "tr") {
      setLocaleState(stored);
      loadTranslations(stored).then(setTranslations);
    }
  }, []);

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
    const t = await loadTranslations(newLocale);
    setTranslations(t);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = LOCALES[newLocale].dir;
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
