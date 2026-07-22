"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Bell, Moon, Sun, Menu, LogOut, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileNav } from "./mobile-nav";
import { LanguageSwitcher } from "./language-switcher";
import { useEffect, useState } from "react";
import { ROL_LABELS } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";

export function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch("/api/bildirimler?count=true");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch {}
    }
    if (session) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-3 lg:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-white dark:bg-gray-900">
              <MobileNav onNavigate={() => setSheetOpen(false)} />
            </SheetContent>
          </Sheet>
          <Link href="/panel" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Apollo</span>
          </Link>
        </div>

        <div className="hidden lg:block" />

        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          )}

          <Link href="/bildirimler">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="hidden sm:inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 outline-none">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-700 dark:text-blue-300">
                {session?.user?.ad?.[0]}
                {session?.user?.soyad?.[0]}
              </div>
              <span className="text-sm font-medium">
                {session?.user?.ad} {session?.user?.soyad}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">
                  {session?.user?.ad} {session?.user?.soyad}
                </p>
                <p className="text-xs text-gray-500">{session?.user?.email}</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  {ROL_LABELS[session?.user?.rol || ""]}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/ayarlar" />}>
                {t.nav.settings}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => signOut({ callbackUrl: "/giris" })}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t.auth.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
