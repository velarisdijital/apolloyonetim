import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
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

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
