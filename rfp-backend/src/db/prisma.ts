// src/db/prisma.ts
import "dotenv/config"; 
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ENV } from "../utils/config";

const adapter = new PrismaPg({
  connectionString: ENV.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

export default prisma;