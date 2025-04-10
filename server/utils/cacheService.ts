/**
 * Build cache service for improving performance by caching build results
 * and other expensive operations.
 */

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

export class BuildCacheService {
  private cache = new Map<string, CacheItem<any>>();
  private static instance: BuildCacheService;
  
  /**
   * Creates a new cache service or returns existing instance (singleton)
   */
  constructor() {
    if (BuildCacheService.instance) {
      return BuildCacheService.instance;
    }
    
    BuildCacheService.instance = this;
  }

  /**
   * Stores an item in the cache
   * 
   * @param key Cache key
   * @param data Data to store
   * @param expiresIn Time in milliseconds until the item expires (default: 1 hour)
   */
  set<T>(key: string, data: T, expiresIn: number = 3600000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }

  /**
   * Retrieves an item from the cache
   * 
   * @param key Cache key
   * @returns The cached item or null if not found or expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if the item has expired
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  /**
   * Checks if an item exists in the cache and is not expired
   * 
   * @param key Cache key
   * @returns true if the item exists and is valid, false otherwise
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // Check if the item has expired
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Deletes an item from the cache
   * 
   * @param key Cache key
   * @returns true if the item was removed, false if it didn't exist
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Clears all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Gets cache statistics
   * 
   * @returns Object containing cache size and other stats
   */
  getStats(): { size: number } {
    return {
      size: this.cache.size
    };
  }
}