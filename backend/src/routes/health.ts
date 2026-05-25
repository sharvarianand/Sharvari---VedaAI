import { Router } from "express";
import mongoose from "mongoose";
import { redisClient } from "../redis/client.js";

export const healthRouter = Router();

/** Simple liveness + readiness probe. */
healthRouter.get("/health", async (_req, res) => {
  const mongo = mongoose.connection.readyState === 1 ? "ok" : "down";
  let redis: "ok" | "down" = "down";
  try {
    const pong = await redisClient().ping();
    redis = pong === "PONG" ? "ok" : "down";
  } catch {
    redis = "down";
  }
  res.json({ status: "ok", mongo, redis, uptime: process.uptime() });
});
