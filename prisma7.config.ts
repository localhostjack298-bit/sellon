import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma ORM 7 configuration (file is named `prisma7.config.ts` per the Prisma 7.10+ guidance so it
// does not clash with the Prisma 8 config format; the Prisma 7 CLI discovers either name).
//
// `process.env.DATABASE_URL` is read lazily so `prisma generate` (used by `postinstall` / CI image
// builds) works even when no database is reachable.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
