import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const kategori = searchParams.get("kategori");

  const where: Record<string, unknown> = {
    buildingId: session.user.buildingId!,
  };

  if (kategori && kategori !== "TUMU") {
    where.kategori = kategori;
  }

  const belgeler = await prisma.belge.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      yukleyen: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(belgeler);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const { baslik, kategori, dosyaYolu, dosyaAdi, dosyaBoyut, aciklama, gecerlilikTarihi } = body;

  if (!baslik || !kategori || !dosyaYolu || !dosyaAdi) {
    return NextResponse.json(
      { error: "Başlık, kategori, dosya yolu ve dosya adı zorunludur" },
      { status: 400 }
    );
  }

  const belge = await prisma.belge.create({
    data: {
      baslik,
      kategori,
      dosyaYolu,
      dosyaAdi,
      dosyaBoyut: dosyaBoyut ? Number(dosyaBoyut) : null,
      aciklama: aciklama || null,
      gecerlilikTarihi: gecerlilikTarihi ? new Date(gecerlilikTarihi) : null,
      buildingId: session.user.buildingId!,
      yukleyenId: session.user.id,
    },
    include: {
      yukleyen: { select: { ad: true, soyad: true } },
    },
  });

  return NextResponse.json(belge, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Belge ID gerekli" }, { status: 400 });
  }

  const belge = await prisma.belge.findUnique({ where: { id } });

  if (!belge) {
    return NextResponse.json({ error: "Belge bulunamadı" }, { status: 404 });
  }

  if (belge.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  await prisma.belge.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
