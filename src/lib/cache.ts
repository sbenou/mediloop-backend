
type CacheItem<T> = {
  data: T;
  timestamp: number;
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export class LocalCache {
  static get<T>(key: string): T | null {
    const item = sessionStorage.getItem(key);
    if (!item) return null;

    const cached: CacheItem<T> = JSON.parse(item);
    const now = new Date().getTime();

    if (now - cached.timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(key);
      return null;
    }

    return cached.data;
  }

  static set<T>(key: string, data: T): void {
    const item: CacheItem<T> = {
      data,
      timestamp: new Date().getTime(),
    };
    sessionStorage.setItem(key, JSON.stringify(item));
  }
}
