import { createServer } from "node:http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { connectMongo, disconnectMongo } from "./db/mongo.js";
import { redisClient, disconnectRedis } from "./redis/client.js";
import { buildApp } from "./app.js";
import { initSockets } from "./sockets/index.js";
import { startGenerationWorker } from "./queue/workers/generation.worker.js";
import { startPdfWorker } from "./queue/workers/pdf.worker.js";
import { closeQueues } from "./queue/queues.js";
import { closeBrowser } from "./services/pdf-service.js";
import { getLlmAdapter } from "./llm/index.js";

/**
 * Boot order is deliberate:
 * 1. Connect Mongo + Redis (fail fast if down)
 * 2. Build app + http server
 * 3. Attach socket.io to the server
 * 4. Start workers (they emit via the same socket.io instance)
 * 5. Listen
 *
 * Graceful shutdown reverses the order so in-flight jobs complete before
 * we tear down infrastructure.
 */
async function main(): Promise<void> {
  await connectMongo();
  redisClient(); // eager-connect for fast first request
  getLlmAdapter(); // log which provider is wired

  const app = buildApp();
  const server = createServer(app);
  initSockets(server);

  const generationWorker = startGenerationWorker();
  const pdfWorker = startPdfWorker();

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "vedaai backend listening");
  });

  /* -------------------------- graceful shutdown ---------------------- */
  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "shutdown initiated");

    server.close(() => logger.info("http closed"));

    await Promise.allSettled([
      generationWorker.close(),
      pdfWorker.close(),
      closeBrowser(),
    ]);
    await closeQueues().catch((err) => logger.error({ err }, "queue close failed"));
    await disconnectRedis().catch((err) => logger.error({ err }, "redis close failed"));
    await disconnectMongo().catch((err) => logger.error({ err }, "mongo close failed"));

    logger.info("shutdown complete");
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "uncaughtException");
    void shutdown("uncaughtException");
  });
  process.on("unhandledRejection", (err) => {
    logger.fatal({ err }, "unhandledRejection");
  });
}

main().catch((err) => {
  // Logger may not be ready if the failure happened in env parsing; use both.
  console.error("fatal boot error", err);
  logger.fatal({ err }, "fatal boot error");
  process.exit(1);
});
