import { tr } from "./translations/tr";
import type { TranslationKeys } from "./translations/tr";
import type { Locale } from "./types";
import { DEFAULT_LOCALE } from "./types";

const translationModules: Record<Locale, () => Promise<{ default: TranslationKeys }>> = {
  tr: () => Promise.resolve({ default: tr }),
  ru: () => import("./translations/ru").then((m) => ({ default: m.ru })),
  en: () => import("./translations/en").then((m) => ({ default: m.en })),
  uk: () => import("./translations/uk").then((m) => ({ default: m.uk })),
  pl: () => import("./translations/pl").then((m) => ({ default: m.pl })),
  de: () => import("./translations/de").then((m) => ({ default: m.de })),
  fr: () => import("./translations/fr").then((m) => ({ default: m.fr })),
  ka: () => import("./translations/ka").then((m) => ({ default: m.ka })),
  ar: () => import("./translations/ar").then((m) => ({ default: m.ar })),
};

const cache = new Map<Locale, TranslationKeys>();
cache.set("tr", tr);

export async function loadTranslations(locale: Locale): Promise<TranslationKeys> {
  const cached = cache.get(locale);
  if (cached) return cached;

  try {
    const mod = await translationModules[locale]();
    cache.set(locale, mod.default);
    return mod.default;
  } catch {
    return tr;
  }
}

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem("apollo-locale");
  if (stored && stored in translationModules) return stored as Locale;
  return DEFAULT_LOCALE;
}

export function setStoredLocale(locale: Locale) {
  if (typeof window !== "undefined") {
    localStorage.setItem("apollo-locale", locale);
  }
}

export { tr };
export type { TranslationKeys };
