// packages/database/prisma/seed.ts

import { PasswordUtils } from "@repo/common";
import { getPrismaClient } from "../src";

const prisma = getPrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const password = PasswordUtils.generatePassword(12, true, true, true);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      password,
      role: "ADMIN",
    },
  });

  console.log("✅ Seed concluído.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
