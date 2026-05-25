import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

/**
 * Open the singleton mongoose connection.
 *
 * mongoose maintains an internal connection pool, so we only ever call this
 * once at boot. The connection state lives on `mongoose.connection`.
 */
export async function connectMongo(): Promise<void> {
  mongoose.set("strictQuery", true);
  mongoose.connection.on("error", (err) => logger.error({ err }, "mongo error"));
  mongoose.connection.on("disconnected", () =>
    logger.warn("mongo disconnected")
  );
  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 5_000,
  });
  logger.info({ uri: redact(env.MONGO_URI) }, "mongo connected");
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

function redact(uri: string): string {
  // Hide credentials from logs without losing the host/db part of the URI.
  return uri.replace(/\/\/([^@]*)@/, "//***@");
}
