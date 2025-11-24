import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { CacheManager, CACHE_KEYS } from '../cache/cache-manager.js';

describe('CacheManager', () => {
  let cache;

  beforeEach(() => {
    cache = new CacheManager(300); // 5 minute default TTL
  });

  describe('Basic Operations', () => {
    it('should set and get values', () => {
      cache.set('test-key', 'test-value');
      expect(cache.get('test-key')).toBe('test-value');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeUndefined();
    });

    it('should delete values', () => {
      cache.set('test-key', 'test-value');
      cache.del('test-key');
      expect(cache.get('test-key')).toBeUndefined();
    });

    it('should flush all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.flush();
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });

    it('should check if key exists', () => {
      cache.set('test-key', 'test-value');
      expect(cache.has('test-key')).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should get all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      const keys = cache.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys.length).toBe(2);
    });
  });

  describe('Statistics Tracking', () => {
    it('should track cache hits', () => {
      cache.set('test-key', 'test-value');
      cache.get('test-key');
      cache.get('test-key');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
    });

    it('should track cache misses', () => {
      cache.get('non-existent-1');
      cache.get('non-existent-2');
      
      const stats = cache.getStats();
      expect(stats.misses).toBe(2);
    });

    it('should calculate hit rate correctly', () => {
      cache.set('test-key', 'test-value');
      cache.get('test-key'); // hit
      cache.get('test-key'); // hit
      cache.get('non-existent'); // miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });

    it('should track sets and deletes', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.del('key1');
      
      const stats = cache.getStats();
      expect(stats.sets).toBe(2);
      expect(stats.deletes).toBe(1);
    });

    it('should return 0 hit rate when no requests', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('TTL Support', () => {
    it('should use default TTL', () => {
      cache.set('test-key', 'test-value');
      const ttl = cache.getTtl('test-key');
      expect(ttl).toBeGreaterThan(Date.now());
    });

    it('should use custom TTL', () => {
      cache.set('test-key', 'test-value', 60); // 1 minute
      const ttl = cache.getTtl('test-key');
      expect(ttl).toBeGreaterThan(Date.now());
      expect(ttl).toBeLessThan(Date.now() + 61000); // Less than 61 seconds
    });

    it('should expire values after TTL', async () => {
      cache.set('test-key', 'test-value', 1); // 1 second TTL
      expect(cache.get('test-key')).toBe('test-value');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(cache.get('test-key')).toBeUndefined();
    });
  });

  describe('Cache Key Constants', () => {
    it('should have defined cache key constants', () => {
      expect(CACHE_KEYS.VEHICLES_ALL).toBe('vehicles:all');
      expect(CACHE_KEYS.RESULTS_ALL).toBe('results:all');
      expect(CACHE_KEYS.STATS_OVERVIEW).toBe('stats:overview');
      expect(CACHE_KEYS.LEADERBOARD).toBe('leaderboard');
      expect(CACHE_KEYS.VEHICLE_PREFIX).toBe('vehicle:');
      expect(CACHE_KEYS.TELEMETRY_STATS_PREFIX).toBe('telemetry:stats:');
    });
  });

  describe('Property Tests', () => {
    /**
     * Feature: racing-data-api, Property 4: Cache hit consistency
     * Validates: Requirements 4.1, 4.2
     * 
     * For any cached data, subsequent requests for the same resource should 
     * return identical data without querying the database until cache expires
     */
    it('Property 4: Cache hit consistency - subsequent gets return identical data', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // cache key
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.double(),
            fc.boolean(),
            fc.array(fc.anything()),
            fc.record({
              id: fc.integer(),
              name: fc.string(),
              value: fc.double()
            })
          ), // cache value (various types)
          fc.integer({ min: 2, max: 20 }), // number of subsequent gets
          (key, value, numGets) => {
            const testCache = new CacheManager(300);
            
            // Set the value
            testCache.set(key, value);
            
            // Get the value multiple times
            const results = [];
            for (let i = 0; i < numGets; i++) {
              results.push(testCache.get(key));
            }
            
            // All results should be identical to the original value
            const allIdentical = results.every(result => {
              if (typeof value === 'object' && value !== null) {
                return JSON.stringify(result) === JSON.stringify(value);
              }
              return result === value;
            });
            
            // Verify statistics
            const stats = testCache.getStats();
            const allHits = stats.hits === numGets;
            const noMisses = stats.misses === 0;
            
            return allIdentical && allHits && noMisses;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: racing-data-api, Property 5: Cache expiration and refresh
     * Validates: Requirements 4.3, 4.4
     * 
     * For any cached entry with TTL, after the TTL expires, 
     * the next request should fetch fresh data from the database
     * 
     * Note: This property test verifies the TTL mechanism by checking that:
     * 1. Values can be set with custom TTLs
     * 2. The cache correctly tracks TTL timestamps
     * 3. Values can be refreshed after setting
     */
    it('Property 5: Cache expiration and refresh - TTL mechanism works correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // cache key
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.double(),
            fc.record({
              id: fc.integer(),
              value: fc.string()
            })
          ), // cache value
          fc.integer({ min: 1, max: 300 }), // TTL in seconds
          (key, value, ttl) => {
            const testCache = new CacheManager(300); // Default TTL
            
            // Set the value with custom TTL
            testCache.set(key, value, ttl);
            
            // Verify value is cached
            const cachedValue = testCache.get(key);
            const isInitiallyCached = cachedValue !== undefined;
            
            // Verify TTL is set correctly (should be in the future)
            const ttlTimestamp = testCache.getTtl(key);
            const hasTtl = ttlTimestamp !== undefined && ttlTimestamp > Date.now();
            
            // Verify the TTL is approximately correct (within 1 second tolerance)
            const expectedTtl = Date.now() + (ttl * 1000);
            const ttlIsReasonable = Math.abs(ttlTimestamp - expectedTtl) < 1000;
            
            return isInitiallyCached && hasTtl && ttlIsReasonable;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Additional test for Property 5: Verify cache refresh mechanism
     * Tests that values can be updated/refreshed in the cache
     */
    it('Property 5: Cache expiration and refresh - can refresh cached values', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // cache key
          fc.string(), // first value
          fc.string(), // second value
          fc.integer({ min: 1, max: 300 }), // TTL in seconds
          (key, value1, value2, ttl) => {
            const testCache = new CacheManager(300);
            
            // Set first value
            testCache.set(key, value1, ttl);
            const firstGet = testCache.get(key);
            
            // Refresh with new value (simulating database refresh)
            testCache.set(key, value2, ttl);
            const refreshedValue = testCache.get(key);
            
            // Property: Cache should allow refreshing values
            // The refreshed value should be the new value
            return firstGet === value1 && refreshedValue === value2;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
