import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
    const { mevcutSifre, yeniSifre, yeniSifreTekrar } = body;

    if (!mevcutSifre || !yeniSifre || !yeniSifreTekrar) {
      return NextResponse.json(
        { error: "Tüm alanları doldurunuz." },
        { status: 400 }
      );
    }

    if (yeniSifre !== yeniSifreTekrar) {
      return NextResponse.json(
        { error: "Yeni şifreler eşleşmiyor." },
        { status: 400 }
      );
    }

    if (yeniSifre.length < 6) {
      return NextResponse.json(
        { error: "Yeni şifre en az 6 karakter olmalıdır." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(mevcutSifre, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Mevcut şifre yanlış." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(yeniSifre, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: hashedPassword },
    });

    return NextResponse.json({ message: "Şifre başarıyla güncellendi." });
  } catch (error) {
    console.error("Şifre güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Şifre güncellenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
