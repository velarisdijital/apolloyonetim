import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN" && session.user.rol !== "KAPICI") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;

  const kayit = await prisma.temizlikKayit.findUnique({ where: { id } });

  if (!kayit) {
    return NextResponse.json({ error: "Kayit bulunamadi" }, { status: 404 });
  }

  if (kayit.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  // Delete photo files from disk
  try {
    const fotograflar: string[] = JSON.parse(kayit.fotograflar || "[]");
    for (const foto of fotograflar) {
      try {
        await unlink(path.join(process.cwd(), "public", foto));
      } catch {
        // File may already be gone
      }
    }
  } catch {
    // JSON parse error
  }

  await prisma.temizlikKayit.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
