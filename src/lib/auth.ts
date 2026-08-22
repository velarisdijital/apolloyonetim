import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { checkRateLimit, resetRateLimit } from "./rate-limit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/giris" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Brute-force koruması: IP başına dakikada 8 deneme
        const headers = (req?.headers ?? {}) as Record<string, string | undefined>;
        const xff = headers["x-forwarded-for"] || "";
        const ip = xff.split(",")[0].trim() || headers["x-real-ip"] || "unknown";
        const rlKey = `web-login:${ip}`;
        if (!checkRateLimit(rlKey, 8, 60_000).allowed) {
          throw new Error("Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.aktif) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        resetRateLimit(rlKey); // başarılı giriş: sayacı temizle

        return {
          id: user.id,
          email: user.email,
          ad: user.ad,
          soyad: user.soyad,
          rol: user.rol,
          buildingId: user.buildingId,
          apartmentId: user.apartmentId,
          locale: user.locale ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = user.rol;
        token.buildingId = user.buildingId;
        token.apartmentId = user.apartmentId;
        token.ad = user.ad;
        token.soyad = user.soyad;
        token.locale = user.locale;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as string;
        session.user.buildingId = token.buildingId as string | null;
        session.user.apartmentId = token.apartmentId as string | null;
        session.user.ad = token.ad as string;
        session.user.soyad = token.soyad as string;
        session.user.locale = token.locale as string | undefined;
      }
      return session;
    },
  },
};
