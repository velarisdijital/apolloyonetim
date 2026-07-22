import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { ad, soyad, telefon } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ad,
        soyad,
        telefon,
      },
      select: {
        id: true,
        email: true,
        ad: true,
        soyad: true,
        telefon: true,
        rol: true,
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
