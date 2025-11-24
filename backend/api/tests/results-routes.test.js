/**
 * Results Routes Tests
 * Integration tests for race results API endpoints
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import { CacheManager } from '../cache/cache-manager.js';
import resultsRoutes from '../routes/results.js';
import { errorHandler } from '../middleware/error-handler.js';

describe('Results Routes', () => {
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
    app.use('/api/results', resultsRoutes);
    
    // Register error handler
    app.use(errorHandler);
  });

  afterEach(() => {
    closeDatabase(db);
    cache.flush();
  });

  /**
   * Helper function to insert test vehicles (required for foreign key)
   */
  function insertVehicles(vehicles) {
    const stmt = db.prepare(`
      INSERT INTO vehicles (vehicle_id, car_number, class, fastest_lap, average_lap, total_laps, max_speed, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const vehicle of vehicles) {
      stmt.run(
        vehicle.vehicle_id,
        vehicle.car_number,
        vehicle.class,
        vehicle.fastest_lap || 150000,
        vehicle.average_lap || 152000,
        vehicle.total_laps || 50,
        vehicle.max_speed || 180.0,
        vehicle.position || 1
      );
    }
  }

  /**
   * Helper function to insert test results
   */
  function insertResults(results) {
    // First insert vehicles for foreign key constraint
    const vehicles = results.map(r => ({
      vehicle_id: r.vehicle_id,
      car_number: r.car_number,
      class: r.class,
      position: r.position
    }));
    insertVehicles(vehicles);

    const stmt = db.prepare(`
      INSERT INTO race_results (vehicle_id, position, car_number, laps, total_time, gap_first, gap_previous, best_lap_time, class)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const result of results) {
      stmt.run(
        result.vehicle_id,
        result.position,
        result.car_number,
        result.laps,
        result.total_time,
        result.gap_first,
        result.gap_previous,
        result.best_lap_time,
        result.class
      );
    }
  }

  describe('GET /api/results', () => {
    // Example 4: Results endpoint
    // Validates: Requirements 1.4
    it('should return race results with positions', async () => {
      const results = [
        { 
          vehicle_id: 'GR86-001-10', 
          position: 1, 
          car_number: 10, 
          laps: 50, 
          total_time: '2:05:30.123', 
          gap_first: '0.000', 
          gap_previous: '0.000', 
          best_lap_time: '2:28.456', 
          class: 'Pro' 
        },
        { 
          vehicle_id: 'GR86-002-20', 
          position: 2, 
          car_number: 20, 
          laps: 50, 
          total_time: '2:05:35.789', 
          gap_first: '+5.666', 
          gap_previous: '+5.666', 
          best_lap_time: '2:29.123', 
          class: 'Am' 
        }
      ];
      insertResults(results);

      const response = await request(app)
        .get('/api/results')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.total).toBe(2);
      
      // Verify positions are included
      expect(response.body.data[0].position).toBe(1);
      expect(response.body.data[1].position).toBe(2);
    });

    it('should filter results by class', async () => {
      const results = [
        { vehicle_id: 'GR86-001-10', position: 1, car_number: 10, laps: 50, total_time: '2:05:30.123', gap_first: '0.000', gap_previous: '0.000', best_lap_time: '2:28.456', class: 'Pro' },
        { vehicle_id: 'GR86-002-20', position: 2, car_number: 20, laps: 50, total_time: '2:05:35.789', gap_first: '+5.666', gap_previous: '+5.666', best_lap_time: '2:29.123', class: 'Am' },
        { vehicle_id: 'GR86-003-30', position: 3, car_number: 30, laps: 50, total_time: '2:05:40.456', gap_first: '+10.333', gap_previous: '+4.667', best_lap_time: '2:28.789', class: 'Pro' }
      ];
      insertResults(results);

      const response = await request(app)
        .get('/api/results?class=Pro')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(r => r.class === 'Pro')).toBe(true);
    });

    it('should sort results by position', async () => {
      const results = [
        { vehicle_id: 'GR86-003-30', position: 3, car_number: 30, laps: 50, total_time: '2:05:40.456', gap_first: '+10.333', gap_previous: '+4.667', best_lap_time: '2:28.789', class: 'Pro' },
        { vehicle_id: 'GR86-001-10', position: 1, car_number: 10, laps: 50, total_time: '2:05:30.123', gap_first: '0.000', gap_previous: '0.000', best_lap_time: '2:28.456', class: 'Pro' },
        { vehicle_id: 'GR86-002-20', position: 2, car_number: 20, laps: 50, total_time: '2:05:35.789', gap_first: '+5.666', gap_previous: '+5.666', best_lap_time: '2:29.123', class: 'Am' }
      ];
      insertResults(results);

      const response = await request(app)
        .get('/api/results?sortBy=position&order=asc')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
      
      // Verify ascending order by position
      const positions = response.body.data.map(r => r.position);
      for (let i = 0; i < positions.length - 1; i++) {
        expect(positions[i]).toBeLessThanOrEqual(positions[i + 1]);
      }
    });

    it('should cache results', async () => {
      const results = [
        { vehicle_id: 'GR86-001-10', position: 1, car_number: 10, laps: 50, total_time: '2:05:30.123', gap_first: '0.000', gap_previous: '0.000', best_lap_time: '2:28.456', class: 'Pro' }
      ];
      insertResults(results);

      // First request - should hit database
      await request(app).get('/api/results').expect(200);
      
      const statsAfterFirst = cache.getStats();
      expect(statsAfterFirst.sets).toBeGreaterThan(0);

      // Second request - should hit cache
      await request(app).get('/api/results').expect(200);
      
      const statsAfterSecond = cache.getStats();
      expect(statsAfterSecond.hits).toBeGreaterThan(0);
    });

    it('should return empty array when no results exist', async () => {
      const response = await request(app)
        .get('/api/results')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });
  });

  describe('GET /api/results/vehicle/:vehicleId', () => {
    it('should return result for specific vehicle', async () => {
      const result = {
        vehicle_id: 'GR86-004-78',
        position: 5,
        car_number: 78,
        laps: 45,
        total_time: '2:10:15.456',
        gap_first: '+25.333',
        gap_previous: '+5.123',
        best_lap_time: '2:28.630',
        class: 'Am'
      };
      insertResults([result]);

      const response = await request(app)
        .get('/api/results/vehicle/GR86-004-78')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.vehicle_id).toBe('GR86-004-78');
      expect(response.body.data.position).toBe(5);
      expect(response.body.data.car_number).toBe(78);
    });

    it('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .get('/api/results/vehicle/GR86-999-99')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VEHICLE_NOT_FOUND');
    });

    it('should return 400 for invalid vehicle ID format', async () => {
      const response = await request(app)
        .get('/api/results/vehicle/INVALID-ID')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should cache vehicle result', async () => {
      const result = {
        vehicle_id: 'GR86-004-78',
        position: 5,
        car_number: 78,
        laps: 45,
        total_time: '2:10:15.456',
        gap_first: '+25.333',
        gap_previous: '+5.123',
        best_lap_time: '2:28.630',
        class: 'Am'
      };
      insertResults([result]);

      // First request
      await request(app).get('/api/results/vehicle/GR86-004-78').expect(200);
      
      const statsAfterFirst = cache.getStats();
      expect(statsAfterFirst.sets).toBeGreaterThan(0);

      // Second request - should hit cache
      await request(app).get('/api/results/vehicle/GR86-004-78').expect(200);
      
      const statsAfterSecond = cache.getStats();
      expect(statsAfterSecond.hits).toBeGreaterThan(0);
    });
  });

  describe('GET /api/results/class/:class', () => {
    it('should return results for specific class', async () => {
      const results = [
        { vehicle_id: 'GR86-001-10', position: 1, car_number: 10, laps: 50, total_time: '2:05:30.123', gap_first: '0.000', gap_previous: '0.000', best_lap_time: '2:28.456', class: 'Pro' },
        { vehicle_id: 'GR86-002-20', position: 2, car_number: 20, laps: 50, total_time: '2:05:35.789', gap_first: '+5.666', gap_previous: '+5.666', best_lap_time: '2:29.123', class: 'Am' },
        { vehicle_id: 'GR86-003-30', position: 3, car_number: 30, laps: 50, total_time: '2:05:40.456', gap_first: '+10.333', gap_previous: '+4.667', best_lap_time: '2:28.789', class: 'Pro' }
      ];
      insertResults(results);

      const response = await request(app)
        .get('/api/results/class/Pro')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(r => r.class === 'Pro')).toBe(true);
      expect(response.body.meta.class).toBe('Pro');
    });

    it('should sort class results by position', async () => {
      const results = [
        { vehicle_id: 'GR86-003-30', position: 3, car_number: 30, laps: 50, total_time: '2:05:40.456', gap_first: '+10.333', gap_previous: '+4.667', best_lap_time: '2:28.789', class: 'Pro' },
        { vehicle_id: 'GR86-001-10', position: 1, car_number: 10, laps: 50, total_time: '2:05:30.123', gap_first: '0.000', gap_previous: '0.000', best_lap_time: '2:28.456', class: 'Pro' }
      ];
      insertResults(results);

      const response = await request(app)
        .get('/api/results/class/Pro?sortBy=position&order=asc')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].position).toBe(1);
      expect(response.body.data[1].position).toBe(3);
    });

    it('should return empty array for class with no results', async () => {
      const response = await request(app)
        .get('/api/results/class/NonExistent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });

    it('should cache class results', async () => {
      const results = [
        { vehicle_id: 'GR86-001-10', position: 1, car_number: 10, laps: 50, total_time: '2:05:30.123', gap_first: '0.000', gap_previous: '0.000', best_lap_time: '2:28.456', class: 'Pro' }
      ];
      insertResults(results);

      // First request
      await request(app).get('/api/results/class/Pro').expect(200);
      
      const statsAfterFirst = cache.getStats();
      expect(statsAfterFirst.sets).toBeGreaterThan(0);

      // Second request - should hit cache
      await request(app).get('/api/results/class/Pro').expect(200);
      
      const statsAfterSecond = cache.getStats();
      expect(statsAfterSecond.hits).toBeGreaterThan(0);
    });
  });
});
