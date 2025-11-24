/**
 * Health Routes Tests
 * Integration tests for health check API endpoint
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import { CacheManager } from '../cache/cache-manager.js';
import healthRoutes from '../routes/health.js';
import { errorHandler } from '../middleware/error-handler.js';

describe('Health Routes', () => {
  let app;
  let db;
  let cache;

  beforeEach(() => {
    // Create in-memory database for testing
    db = initializeDatabase(':memory:', { memory: true });
    
    // Create cache manager
    cache = new CacheManager(300);

    // Set up Express app
    app = express();
    app.use(express.json());
    
    // Make db and cache available to routes
    app.locals.db = db;
    app.locals.cache = cache;
    
    // Register routes
    app.use('/api/health', healthRoutes);
    
    // Register error handler
    app.use(errorHandler);
  });

  afterEach(() => {
    closeDatabase(db);
    cache.flush();
  });

  describe('GET /api/health', () => {
    // Example 16: Health endpoint
    // Validates: Requirements 11.1
    it('should return system status and database connectivity', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.database).toBeDefined();
      expect(response.body.data.database.status).toBe('connected');
    });

    it('should include cache statistics', async () => {
      // Add some cache entries
      cache.set('test-key-1', 'value1');
      cache.set('test-key-2', 'value2');
      cache.get('test-key-1'); // Hit
      cache.get('non-existent'); // Miss

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.data.cache).toBeDefined();
      expect(response.body.data.cache.enabled).toBe(true);
      expect(response.body.data.cache.keys).toBeGreaterThan(0);
      expect(response.body.data.cache.hits).toBeGreaterThan(0);
      expect(response.body.data.cache.misses).toBeGreaterThan(0);
      expect(response.body.data.cache.hitRate).toBeDefined();
    });

    it('should include system uptime', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.data.uptime).toBeDefined();
      expect(response.body.data.uptime.milliseconds).toBeGreaterThan(0);
      expect(response.body.data.uptime.seconds).toBeGreaterThanOrEqual(0);
      expect(response.body.data.uptime.formatted).toBeDefined();
      expect(typeof response.body.data.uptime.formatted).toBe('string');
    });

    it('should include memory usage', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.data.memory).toBeDefined();
      expect(response.body.data.memory.heapUsed).toBeGreaterThan(0);
      expect(response.body.data.memory.heapTotal).toBeGreaterThan(0);
      expect(response.body.data.memory.rss).toBeGreaterThan(0);
    });

    it('should include timestamp', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.data.timestamp).toBeDefined();
      expect(new Date(response.body.data.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should return 503 when database is disconnected', async () => {
      // Close the database to simulate disconnection
      closeDatabase(db);

      const response = await request(app)
        .get('/api/health')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('unhealthy');
      expect(response.body.data.database.status).toBe('error');
      expect(response.body.data.database.error).toBeDefined();
    });

    it('should return cache statistics even when database is down', async () => {
      // Add some cache entries
      cache.set('test-key', 'value');
      
      // Close the database
      closeDatabase(db);

      const response = await request(app)
        .get('/api/health')
        .expect(503);

      expect(response.body.data.cache).toBeDefined();
      expect(response.body.data.cache.enabled).toBe(true);
    });

    it('should return uptime even when database is down', async () => {
      // Close the database
      closeDatabase(db);

      const response = await request(app)
        .get('/api/health')
        .expect(503);

      expect(response.body.data.uptime).toBeDefined();
      expect(response.body.data.uptime.milliseconds).toBeGreaterThan(0);
    });
  });
});
