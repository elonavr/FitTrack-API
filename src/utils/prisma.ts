//prisma.ts (singelton):
import { PrismaClient } from "@prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";

import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL as string;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
    adapter: adapter,
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
