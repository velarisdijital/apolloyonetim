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
  const adminHash = await bcrypt.hash("admin123", 10);
  const kapiciHash = await bcrypt.hash("kapici123", 10);
  const denetciHash = await bcrypt.hash("denetci123", 10);
  const sakinHash = await bcrypt.hash("sakin123", 10);
  const kiraciHash = await bcrypt.hash("kiraci123", 10);

  const building = await prisma.building.create({
    data: {
      ad: "Yıldız Apartmanı",
      adres: "Atatürk Caddesi No: 42",
      sehir: "Antalya",
      katSayisi: 5,
      daireSayisi: 10,
    },
  });

  const apartments = [];
  for (let kat = 1; kat <= 5; kat++) {
    for (let daire = 1; daire <= 2; daire++) {
      const no = `${kat}${daire === 1 ? "A" : "B"}`;
      const apt = await prisma.apartment.create({
        data: {
          no,
          kat,
          metrekare: 80 + Math.floor(Math.random() * 40),
          buildingId: building.id,
        },
      });
      apartments.push(apt);
    }
  }

  // MASTER_ADMIN — her şeye tam yetki
  await prisma.user.create({
    data: {
      email: "admin@apartman.com",
      passwordHash: adminHash,
      ad: "Ahmet",
      soyad: "Yılmaz",
      telefon: "0532 111 2233",
      rol: "MASTER_ADMIN",
      buildingId: building.id,
      apartmentId: apartments[0].id,
    },
  });

  // KAPICI — fatura/gider girişi, teknik talepler, rezervasyon yönetimi
  await prisma.user.create({
    data: {
      email: "kapici@apartman.com",
      passwordHash: kapiciHash,
      ad: "Mehmet",
      soyad: "Demir",
      telefon: "0533 222 3344",
      rol: "KAPICI",
      buildingId: building.id,
    },
  });

  // DENETCI — mali işlem onayı
  await prisma.user.create({
    data: {
      email: "denetci@apartman.com",
      passwordHash: denetciHash,
      ad: "Hasan",
      soyad: "Korkmaz",
      telefon: "0534 333 4455",
      rol: "DENETCI",
      buildingId: building.id,
      apartmentId: apartments[4].id,
    },
  });

  // EV_SAHIBI — talep açabilir, aidatlarını görebilir
  const evSahipleri = [
    { ad: "Ayşe", soyad: "Kaya", email: "ayse@apartman.com", aptIndex: 1 },
    { ad: "Fatma", soyad: "Çelik", email: "fatma@apartman.com", aptIndex: 2 },
    { ad: "Ali", soyad: "Öztürk", email: "ali@apartman.com", aptIndex: 3 },
  ];

  for (const sakin of evSahipleri) {
    await prisma.user.create({
      data: {
        email: sakin.email,
        passwordHash: sakinHash,
        ad: sakin.ad,
        soyad: sakin.soyad,
        rol: "EV_SAHIBI",
        buildingId: building.id,
        apartmentId: apartments[sakin.aptIndex].id,
      },
    });
  }

  // KIRACI — talep açabilir, sınırlı erişim
  await prisma.user.create({
    data: {
      email: "kiraci@apartman.com",
      passwordHash: kiraciHash,
      ad: "Zeynep",
      soyad: "Aksoy",
      telefon: "0535 444 5566",
      rol: "KIRACI",
      buildingId: building.id,
      apartmentId: apartments[5].id,
    },
  });

  console.log("Seed tamamlandı!");
  console.log("");
  console.log("Kullanıcılar:");
  console.log("  MASTER_ADMIN : admin@apartman.com    / admin123");
  console.log("  KAPICI       : kapici@apartman.com   / kapici123");
  console.log("  DENETCI      : denetci@apartman.com  / denetci123");
  console.log("  EV_SAHIBI    : ayse@apartman.com     / sakin123");
  console.log("  KIRACI       : kiraci@apartman.com   / kiraci123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
