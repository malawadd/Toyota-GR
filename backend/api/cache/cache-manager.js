import NodeCache from 'node-cache';

/**
 * Cache key constants for consistent cache key naming
 */
export const CACHE_KEYS = {
  VEHICLES_ALL: 'vehicles:all',
  RESULTS_ALL: 'results:all',
  STATS_OVERVIEW: 'stats:overview',
  LEADERBOARD: 'leaderboard',
  VEHICLE_PREFIX: 'vehicle:',
  TELEMETRY_STATS_PREFIX: 'telemetry:stats:',
  WEATHER_SUMMARY: 'weather:summary'
};

/**
 * CacheManager class for managing in-memory cache with TTL support
 * and statistics tracking
 */
export class CacheManager {
  /**
   * Create a new CacheManager instance
   * @param {number} ttl - Default time-to-live in seconds (default: 300 = 5 minutes)
   */
  constructor(ttl = 300) {
    this.cache = new NodeCache({
      stdTTL: ttl,
      checkperiod: ttl * 0.2, // Check for expired keys every 20% of TTL
      useClones: false // Don't clone objects for better performance
    });
    
    // Statistics tracking
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined if not found or expired
   */
  get(key) {
    const value = this.cache.get(key);
    
    if (value !== undefined) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    
    return value;
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number|null} ttl - Optional custom TTL in seconds (overrides default)
   * @returns {boolean} True if successful
   */
  set(key, value, ttl = null) {
    this.stats.sets++;
    
    if (ttl !== null) {
      return this.cache.set(key, value, ttl);
    }
    
    return this.cache.set(key, value);
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {number} Number of deleted entries (0 or 1)
   */
  del(key) {
    this.stats.deletes++;
    return this.cache.del(key);
  }

  /**
   * Flush all cache entries
   */
  flush() {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   * @returns {Object} Statistics object with hits, misses, keys, and hit rate
   */
  getStats() {
    const keys = this.cache.keys().length;
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 
      ? (this.stats.hits / totalRequests) * 100 
      : 0;
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      keys,
      hitRate: parseFloat(hitRate.toFixed(2))
    };
  }

  /**
   * Get TTL for a specific key
   * @param {string} key - Cache key
   * @returns {number|undefined} TTL in seconds, or undefined if key doesn't exist
   */
  getTtl(key) {
    return this.cache.getTtl(key);
  }

  /**
   * Check if a key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Get all cache keys
   * @returns {string[]} Array of cache keys
   */
  keys() {
    return this.cache.keys();
  }
}
