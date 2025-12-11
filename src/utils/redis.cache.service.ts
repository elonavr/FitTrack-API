import redisClient from "./redis.client";

const DEFAULT_TTL_SECONDS = 3600;

class RedisCacheService {
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const data = await redisClient.get(key);

      if (!data) {
        return undefined;
      }
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(
        `Failed to get or parse cached data for key: ${key}`,
        error
      );
      return undefined;
    }
  }
  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = DEFAULT_TTL_SECONDS
  ): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);

      // EX (Expiration time in seconds)
      const result = await redisClient.set(
        key,
        serializedValue,
        "EX",
        ttlSeconds
      );

      return result === "OK";
    } catch (error) {
      console.error(`Failed to set cached data for key: ${key}`, error);
      return false;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return redisClient.del(key);
    } catch (e) {
      console.error(`Failed to delete key: ${key}`, e);
      return 0;
    }
  }
}

export default new RedisCacheService();
