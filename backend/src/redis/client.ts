import IORedis, { type Redis, type RedisOptions } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

/**
 * Shared Redis client used for app-level caching.
 *
 * BullMQ requires its own connection (with maxRetriesPerRequest=null), so the
 * queue module creates a separate connection rather than reusing this one.
 */
let _client: Redis | null = null;

export function redisClient(): Redis {
  if (_client) return _client;
  _client = new IORedis(env.REDIS_URL, {
    lazyConnect: false,
    maxRetriesPerRequest: 3,
  } satisfies RedisOptions);
  _client.on("error", (err) => logger.error({ err }, "redis error"));
  _client.on("connect", () => logger.info("redis connected"));
  return _client;
}

export async function disconnectRedis(): Promise<void> {
  if (_client) {
    await _client.quit();
    _client = null;
  }
}
