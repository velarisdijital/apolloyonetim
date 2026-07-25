import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      ad: true,
      soyad: true,
      telefon: true,
      rol: true,
      locale: true,
      buildingId: true,
      apartmentId: true,
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  return NextResponse.json(dbUser);
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { ad, soyad, telefon, locale } = body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ad,
        soyad,
        telefon,
        ...(locale !== undefined && { locale }),
      },
      select: {
        id: true,
        email: true,
        ad: true,
        soyad: true,
        telefon: true,
        rol: true,
        locale: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profil güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Profil güncellenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
