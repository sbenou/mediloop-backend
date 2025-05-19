
type CacheItem<T> = {
  data: T;
  timestamp: number;
};

// Extended cache durations for different types of data
const CACHE_DURATIONS = {
  DEFAULT: 30 * 60 * 1000, // 30 minutes
  TOKEN: 24 * 60 * 60 * 1000, // 24 hours
  GEOCODING: 7 * 24 * 60 * 60 * 1000, // 7 days
  STATIC_MAP: 24 * 60 * 60 * 1000, // 24 hours
  PHARMACY_DATA: 60 * 60 * 1000 // 1 hour
};

export class LocalCache {
  static get<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;

      const cached: CacheItem<T> = JSON.parse(item);
      const now = new Date().getTime();
      
      // Determine appropriate cache duration based on key prefix
      let cacheDuration = CACHE_DURATIONS.DEFAULT;
      
      if (key.startsWith('mapbox-token')) {
        cacheDuration = CACHE_DURATIONS.TOKEN;
      } else if (key.startsWith('mapbox-coords')) {
        cacheDuration = CACHE_DURATIONS.GEOCODING;
      } else if (key.startsWith('static-map')) {
        cacheDuration = CACHE_DURATIONS.STATIC_MAP;
      } else if (key.startsWith('pharmacies')) {
        cacheDuration = CACHE_DURATIONS.PHARMACY_DATA;
      }

      if (now - cached.timestamp > cacheDuration) {
        console.log(`Cache expired for key: ${key}`);
        sessionStorage.removeItem(key);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Error getting item from cache:', error);
      return null;
    }
  }

  static set<T>(key: string, data: T): void {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: new Date().getTime(),
      };
      sessionStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error setting item in cache:', error);
      
      // If we hit storage limits, clear older items
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearOldestItems();
        
        // Try again
        try {
          const item: CacheItem<T> = {
            data,
            timestamp: new Date().getTime(),
          };
          sessionStorage.setItem(key, JSON.stringify(item));
        } catch (retryError) {
          console.error('Failed to set item in cache after clearing space:', retryError);
        }
      }
    }
  }
  
  static delete(key: string): boolean {
    try {
      if (!key) {
        console.error('Cannot delete cache with empty key');
        return false;
      }
      
      // Check if item exists in cache
      const item = sessionStorage.getItem(key);
      if (!item) {
        return false;
      }
      
      // Remove the item
      sessionStorage.removeItem(key);
      console.log(`Cache item deleted for key: ${key}`);
      return true;
    } catch (error) {
      console.error('Error deleting item from cache:', error);
      return false;
    }
  }
  
  static clearOldestItems(): void {
    try {
      const keys = [];
      
      // Get all keys and their timestamps
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          try {
            const item = sessionStorage.getItem(key);
            if (item) {
              const cached = JSON.parse(item);
              if (cached && cached.timestamp) {
                keys.push({ key, timestamp: cached.timestamp });
              }
            }
          } catch (e) {
            // Skip items that can't be parsed
          }
        }
      }
      
      // Sort by timestamp (oldest first)
      keys.sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest 25% of items
      const itemsToRemove = Math.ceil(keys.length * 0.25);
      keys.slice(0, itemsToRemove).forEach(item => {
        sessionStorage.removeItem(item.key);
      });
      
      console.log(`Cleared ${itemsToRemove} oldest items from cache`);
    } catch (error) {
      console.error('Error clearing oldest items from cache:', error);
    }
  }
}
