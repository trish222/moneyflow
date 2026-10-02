import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  REFRESH_TOKEN_SECRET: z.string().min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters"),
  ALLOW_REGISTRATION: z
    .enum(["true", "false"])
    .default("false")
    .transform((val) => val === "true"),
  FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL (e.g., http://localhost:5173)"),
});

export const env = envSchema.parse(process.env);
