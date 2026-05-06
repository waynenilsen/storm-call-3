import { defineConfig } from "@prisma/config";

try {
  process.loadEnvFile();
} catch {
  // .env may not exist yet during the initial `bun i` of `initialize-workspace.sh`.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
