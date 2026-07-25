import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

function createClient() {
  const connectionString = process.env.DATABASE_URL!;

  if (connectionString.startsWith("prisma+postgres://")) {
    const url = new URL(connectionString);
    const apiKey = url.searchParams.get("api_key");
    if (apiKey) {
      const decoded = JSON.parse(
        Buffer.from(apiKey, "base64").toString("utf-8")
      );
      const adapter = new PrismaPg({ connectionString: decoded.databaseUrl });
      return new PrismaClient({ adapter });
    }
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

async function main() {
  const prisma = createClient();

  const email = "velarisdijital@gmail.com";
  const password = "Apollo2026!";
  const ad = "Murat";
  const soyad = "Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Kullanıcı zaten mevcut: ${email} (rol: ${existing.rol})`);
    if (existing.rol !== "MASTER_ADMIN") {
      await prisma.user.update({
        where: { email },
        data: { rol: "MASTER_ADMIN" },
      });
      console.log("Rol MASTER_ADMIN olarak güncellendi.");
    }
    await prisma.$disconnect();
    return;
  }

  let building = await prisma.building.findFirst();
  if (!building) {
    building = await prisma.building.create({
      data: {
        ad: "Ana Bina",
        adres: "Merkez",
        sehir: "Antalya",
        katSayisi: 5,
        daireSayisi: 10,
      },
    });
    console.log("Yeni bina oluşturuldu:", building.ad);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      ad,
      soyad,
      rol: "MASTER_ADMIN",
      buildingId: building.id,
    },
  });

  console.log("Master Admin oluşturuldu:");
  console.log(`  E-posta: ${email}`);
  console.log(`  Şifre: ${password}`);
  console.log(`  Rol: MASTER_ADMIN`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Hata:", e);
  process.exit(1);
});
