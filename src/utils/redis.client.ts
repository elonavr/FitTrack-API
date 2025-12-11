import { Redis } from "ioredis";

const redisClient = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

redisClient.on("error", (err) => {
  console.error(
    "Redis Client Error: Failed to connect or communicate with Redis.",
    err.message
  );
});

redisClient.on("connect", () => {
  console.log("Successfully connected to Redis at:", process.env.REDIS_URL);
});

export default redisClient;
