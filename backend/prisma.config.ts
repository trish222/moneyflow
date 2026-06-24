/* prisma.config.ts configures Prisma ORM for the backend.
 * - defines the database schema path and migration directory.
 * - loads DATABASE_URL from environment variables to connect to PostgreSQL.
 */
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
