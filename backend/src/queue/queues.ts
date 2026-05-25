import { Queue, type QueueOptions } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

/**
 * BullMQ requires a dedicated connection with `maxRetriesPerRequest=null`
 * so blocking commands can park indefinitely without ioredis aborting them.
 * We keep this connection separate from the application cache client.
 */
function makeConnection(): IORedis {
  const conn = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  conn.on("error", (err) => logger.error({ err }, "bullmq redis error"));
  return conn;
}

const sharedConnection = makeConnection();

const baseOptions: QueueOptions = {
  connection: sharedConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 200,
    removeOnFail: 500,
  },
};

export const QUEUES = {
  generation: "vedaai.generation",
  pdf: "vedaai.pdf",
} as const;

export interface GenerationJobData {
  assignmentId: string;
}

export interface PdfJobData {
  assignmentId: string;
}

export const generationQueue = new Queue<GenerationJobData>(
  QUEUES.generation,
  baseOptions
);
export const pdfQueue = new Queue<PdfJobData>(QUEUES.pdf, baseOptions);

export function bullConnection(): IORedis {
  // Workers need their own connection — ioredis doesn't share blocking ops
  // safely between consumers. Use this to instantiate workers.
  return makeConnection();
}

export async function closeQueues(): Promise<void> {
  await Promise.all([generationQueue.close(), pdfQueue.close()]);
  await sharedConnection.quit();
}
