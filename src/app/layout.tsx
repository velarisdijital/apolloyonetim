import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { I18nProvider } from "@/lib/i18n/context";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Apollo Yönetim Sistemi",
  description: "Profesyonel bina ve apartman yönetim uygulaması",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Apollo",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <ThemeProvider>
            <I18nProvider>
              {children}
              <Toaster position="top-right" richColors />
              <ServiceWorkerRegister />
            </I18nProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
