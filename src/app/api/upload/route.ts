import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Dosya 5MB'dan büyük olamaz" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Geçersiz dosya tipi. JPEG, PNG, WebP veya PDF yükleyin." },
      { status: 400 }
    );
  }

  const ext = path.extname(file.name) || ".jpg";
  const filename = `${nanoid()}${ext}`;
  const subdir = path.join(
    session.user.buildingId || "default",
    new Date().toISOString().slice(0, 7)
  );
  const dir = path.join(UPLOAD_DIR, subdir);

  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filepath = path.join(dir, filename);
  await writeFile(filepath, buffer);

  const relativePath = `/uploads/${subdir}/${filename}`;
  return NextResponse.json({ path: relativePath, originalName: file.name });
}
