import { defineConfig } from "prisma/config";

const fallbackDatabaseUrl = "postgresql://dev:dev@localhost:5432/app_dev?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? fallbackDatabaseUrl,
  },
});
