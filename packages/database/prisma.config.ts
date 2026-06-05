import { loadProjectEnv } from "@repo/env-config";
import { defineConfig } from "prisma/config";
import { envDatabase } from "./src/config/env-database";

loadProjectEnv();

const fallbackDatabaseUrl =
  "postgresql://app_user:dev_password_123@localhost:5432/app_db?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: envDatabase.DATABASE_URL ?? fallbackDatabaseUrl,
  },
});
