import pino from "pino";
import { env } from "./env.js";

/**
 * Single shared pino logger.
 *
 * In dev we route through pino-pretty for readable output; in production we
 * emit raw JSON so log aggregators can parse cleanly.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: "vedaai-backend" },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss.l" },
        },
      }
    : {}),
});

export type Logger = typeof logger;
