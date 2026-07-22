"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import {
  LayoutDashboard, Receipt, Wallet, CreditCard, BarChart3,
  Users, Vote, Megaphone, UserCog, Settings, LogOut, Building2, CalendarCheck,
  BookOpen, Wrench, ClipboardCheck, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Receipt, Wallet, CreditCard, BarChart3,
  Users, Vote, Megaphone, UserCog, Settings, CalendarCheck,
  BookOpen, Wrench, ClipboardCheck, MessageCircle,
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const userRole = session?.user?.rol || "";

  const filteredItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <Link href="/panel" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Apollo</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.nav.managementSystem}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              )}
            >
              {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
              {t.nav[item.i18nKey] || item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-700 dark:text-blue-300">
            {session?.user?.ad?.[0]}
            {session?.user?.soyad?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {session?.user?.ad} {session?.user?.soyad}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 dark:text-gray-400"
          onClick={() => signOut({ callbackUrl: "/giris" })}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t.auth.logout}
        </Button>
      </div>
    </aside>
  );
}
