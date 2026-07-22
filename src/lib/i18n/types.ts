export type Locale = "tr" | "ru" | "en" | "uk" | "pl" | "de" | "fr" | "ka" | "ar";

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  flag: string;
}

export const LOCALES: Record<Locale, LocaleInfo> = {
  tr: { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr", flag: "🇹🇷" },
  ru: { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr", flag: "🇷🇺" },
  en: { code: "en", name: "English", nativeName: "English", dir: "ltr", flag: "🇬🇧" },
  uk: { code: "uk", name: "Ukrainian", nativeName: "Українська", dir: "ltr", flag: "🇺🇦" },
  pl: { code: "pl", name: "Polish", nativeName: "Polski", dir: "ltr", flag: "🇵🇱" },
  de: { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr", flag: "🇩🇪" },
  fr: { code: "fr", name: "French", nativeName: "Français", dir: "ltr", flag: "🇫🇷" },
  ka: { code: "ka", name: "Georgian", nativeName: "ქართული", dir: "ltr", flag: "🇬🇪" },
  ar: { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", flag: "🇸🇦" },
};

export const DEFAULT_LOCALE: Locale = "tr";
