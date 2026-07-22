import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { kullaniciSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const kullanicilar = await prisma.user.findMany({
    where: { buildingId: session.user.buildingId! },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      ad: true,
      soyad: true,
      telefon: true,
      rol: true,
      aktif: true,
      createdAt: true,
      apartment: { select: { id: true, no: true, kat: true } },
    },
  });

  return NextResponse.json(kullanicilar);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = kullaniciSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existingUser) {
    return NextResponse.json({ error: "Bu e-posta adresi zaten kullanılıyor" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const kullanici = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      ad: parsed.data.ad,
      soyad: parsed.data.soyad,
      telefon: parsed.data.telefon,
      rol: parsed.data.rol as never,
      apartmentId: parsed.data.apartmentId,
      buildingId: session.user.buildingId!,
    },
    select: {
      id: true,
      email: true,
      ad: true,
      soyad: true,
      telefon: true,
      rol: true,
      aktif: true,
      createdAt: true,
    },
  });

  return NextResponse.json(kullanici, { status: 201 });
}
