"use client";

import { useTranslation } from "@/lib/i18n/context";
import { LOCALES, type Locale } from "@/lib/i18n/types";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOCALE_ORDER: Locale[] = ["tr", "en", "ru", "uk", "pl", "de", "fr", "ka", "ar"];

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 outline-none" title={LOCALES[locale].nativeName}>
        <Globe className="w-5 h-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {LOCALE_ORDER.map((code) => {
          const info = LOCALES[code];
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => setLocale(code)}
              className={locale === code ? "bg-blue-50 dark:bg-blue-950 font-medium" : ""}
            >
              <span className="mr-2">{info.flag}</span>
              {info.nativeName}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
