
/**
 * Simple cache utility for local storage
 */
export class LocalCache {
  /**
   * Store a value in the cache with an optional TTL
   */
  static set<T>(key: string, value: T, ttlSeconds?: number): void {
    try {
      const item = {
        value,
        expiry: ttlSeconds ? new Date().getTime() + ttlSeconds * 1000 : null,
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Error setting cache item:', error);
    }
  }

  /**
   * Get a value from the cache
   */
  static get<T>(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(`cache_${key}`);
      if (!itemStr) {
        return null;
      }

      const item = JSON.parse(itemStr);
      
      // Check if the item has expired
      if (item.expiry && new Date().getTime() > item.expiry) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error('Error getting cache item:', error);
      return null;
    }
  }

  /**
   * Delete a value from the cache
   */
  static delete(key: string): boolean {
    try {
      localStorage.removeItem(`cache_${key}`);
      return true;
    } catch (error) {
      console.error('Error deleting cache item:', error);
      return false;
    }
  }
}
