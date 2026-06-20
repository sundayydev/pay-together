import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

export function getPrisma(databaseUrl: string): PrismaClient {
  // Tự động loại bỏ dấu nháy đơn hoặc nháy kép ở hai đầu (nếu người dùng lỡ dán cả dấu nháy từ file .env)
  const cleanUrl = (databaseUrl || "").trim().replace(/^["']|["']$/g, "");
  const adapter = new PrismaNeon({ connectionString: cleanUrl });
  return new PrismaClient({ adapter });
}
