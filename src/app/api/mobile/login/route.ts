import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, resetRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const rlKey = `mobile-login:${ip}`;
  const rl = checkRateLimit(rlKey, 5, 60_000); // 5 deneme / dakika
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "E-posta ve şifre gerekli" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.aktif) {
    return NextResponse.json({ error: "E-posta veya şifre hatalı" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "E-posta veya şifre hatalı" }, { status: 401 });
  }

  resetRateLimit(rlKey); // başarılı giriş: sayacı temizle

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      ad: user.ad,
      soyad: user.soyad,
      rol: user.rol,
      buildingId: user.buildingId,
      apartmentId: user.apartmentId,
    },
    process.env.NEXTAUTH_SECRET!,
    { expiresIn: "30d" }
  );

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      ad: user.ad,
      soyad: user.soyad,
      rol: user.rol,
      buildingId: user.buildingId,
    },
  });
}
