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

const prisma = createClient();

async function main() {
  const adminHash = await bcrypt.hash("Apollo2026!", 10);

  const building = await prisma.building.create({
    data: {
      ad: "Apollo Apartmanı",
      adres: "",
      sehir: "",
      katSayisi: 1,
      daireSayisi: 1,
    },
  });

  await prisma.apartment.create({
    data: {
      no: "1",
      kat: 1,
      metrekare: 100,
      buildingId: building.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "velarisdijital@gmail.com",
      passwordHash: adminHash,
      ad: "Admin",
      soyad: "Apollo",
      rol: "MASTER_ADMIN",
      buildingId: building.id,
    },
  });

  console.log("Seed tamamlandi!");
  console.log("");
  console.log("  MASTER_ADMIN : velarisdijital@gmail.com / Apollo2026!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
