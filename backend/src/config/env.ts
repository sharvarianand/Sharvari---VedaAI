import "dotenv/config";
import { z } from "zod";

/**
 * Strongly-typed environment loader.
 *
 * All process.env reads should go through `env` so we fail fast on misconfig
 * instead of crashing deep in a worker. Defaults match the docker-compose
 * services so a clean clone runs out of the box.
 */
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:4000"),
  CORS_ORIGIN: z.string()
    .default("http://localhost:3000,http://127.0.0.1:3000")
    .transform((val) => val.split(",").map((s) => s.trim())),

  MONGO_URI: z.string().default("mongodb://localhost:27017/vedaai"),
  REDIS_URL: z.string().default("redis://localhost:6380"),

  LLM_PROVIDER: z
    .enum(["mock", "openai", "openrouter", "gemini", "anthropic"])
    .default("mock"),
  LLM_MODEL: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
  OPENROUTER_SITE_URL: z.string().url().optional(),
  OPENROUTER_APP_NAME: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // We deliberately use console.error here — the logger isn't ready yet.
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
