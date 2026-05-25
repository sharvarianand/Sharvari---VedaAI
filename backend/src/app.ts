import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { assignmentsRouter } from "./routes/assignments.js";
import { printRouter } from "./routes/print.js";
import { errorHandler } from "./middleware/error.js";

/**
 * Build the Express application.
 *
 * Kept independent from server boot (`index.ts`) so tests can spin up an
 * isolated app with `supertest` against an in-memory mongo + redis-mock.
 */
export function buildApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(healthRouter);
  app.use("/api/assignments", assignmentsRouter);
  app.use(printRouter);

  // 404 fallback for unknown routes (must come before error handler).
  app.use((_req, res) => {
    res.status(404).json({ status: 404, code: "not_found", message: "Route not found" });
  });

  app.use(errorHandler);
  return app;
}
