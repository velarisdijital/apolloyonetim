import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/sakinler") && token?.rol !== "MASTER_ADMIN") {
      return NextResponse.redirect(new URL("/panel", req.url));
    }

    if (path.startsWith("/onay-bekleyen") && !["MASTER_ADMIN", "DENETCI"].includes(token?.rol as string)) {
      return NextResponse.redirect(new URL("/panel", req.url));
    }

    if (
      (path.startsWith("/odemeler") || path === "/giderler/ekle") &&
      !["MASTER_ADMIN", "KAPICI"].includes(token?.rol as string)
    ) {
      return NextResponse.redirect(new URL("/panel", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/panel/:path*",
    "/giderler/:path*",
    "/aidatlar/:path*",
    "/odemeler/:path*",
    "/raporlar/:path*",
    "/toplantilar/:path*",
    "/oylamalar/:path*",
    "/duyurular/:path*",
    "/bildirimler/:path*",
    "/sakinler/:path*",
    "/onay-bekleyen/:path*",
    "/ayarlar/:path*",
    "/rezervasyonlar/:path*",
    "/arizalar/:path*",
    "/kurallar/:path*",
  ],
};
