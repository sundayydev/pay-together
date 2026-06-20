import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

export function getPrisma(databaseUrl: string): PrismaClient {
  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}
