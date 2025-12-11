import NodeCache from "node-cache";
import type { Options } from "node-cache";

const cascheOptions: Options = {
  stdTTL: 3600,
  checkperiod: 600,
  useClones: false,
};

const myCache = new NodeCache(cascheOptions);

class MemoryCacheService {
  get<T>(key: string): T | undefined {
    return myCache.get<T>(key);
  }

  set<T>(key: string, value: T, ttlSeconds?: number): boolean {
    if (ttlSeconds !== undefined) {
      return myCache.set(key, value, ttlSeconds);
    } else {
      return myCache.set(key, value);
    }
  }
  del(key: string): void {
    myCache.del(key);
  }
}

export default new MemoryCacheService();
