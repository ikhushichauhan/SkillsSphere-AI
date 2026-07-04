import { createClient } from "redis";
import dotenv from "dotenv";

import logger from "../utils/logger.js";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const redisUrl = isProduction ? process.env.REDIS_URL : (process.env.REDIS_URL || "redis://localhost:6379");

const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      const maxRetries = isProduction ? 10 : (process.env.REDIS_URL ? 10 : 0);
      if (retries > maxRetries) return new Error("Redis max retries reached");
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on("error", (err) => {
  if (isProduction || process.env.REDIS_URL) {
    logger.error("Redis error:", err.message);
  }
});

redisClient.on("connect", () => {
  logger.info("Redis Client Connected");
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.info("Redis connection skipped for local development");
  }
};

export default redisClient;
