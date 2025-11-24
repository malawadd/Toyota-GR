/**
 * Statistics Routes Tests
 * Integration tests for statistics API endpoints
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import { CacheManager } from '../cache/cache-manager.js';
import statisticsRoutes from '../routes/statistics.js';
import { errorHandler } from '../middleware/error-handler.js';

describe('Statistics Routes', () => {
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
    app.use('/api/statistics', statisticsRoutes);
    
    // Register error handler
    app.use(errorHandler);
  });

  afterEach(() => {
    closeDatabase(db);
    cache.flush();
  });

  /**
   * Helper function to insert test vehicles
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
        vehicle.fastest_lap,
        vehicle.average_lap,
        vehicle.total_laps,
        vehicle.max_speed,
        vehicle.position
      );
    }
  }

  /**
   * Helper function to insert test lap times
   */
  function insertLapTimes(lapTimes) {
    const stmt = db.prepare(`
      INSERT INTO lap_times (vehicle_id, lap, lap_time, timestamp)
      VALUES (?, ?, ?, ?)
    `);

    for (const lap of lapTimes) {
      stmt.run(lap.vehicle_id, lap.lap, lap.lap_time, lap.timestamp);
    }
  }

  /**
   * Helper function to insert test section times
   */
  function insertSectionTimes(sections) {
    const stmt = db.prepare(`
      INSERT INTO section_times (vehicle_id, lap, s1, s2, s3, lap_time, top_speed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const section of sections) {
      stmt.run(
        section.vehicle_id,
        section.lap,
        section.s1,
        section.s2,
        section.s3,
        section.lap_time,
        section.top_speed
      );
    }
  }

  describe('GET /api/statistics/overview', () => {
    // Example 18: Overview statistics
    // Validates: Requirements 13.1
    it('should return race-wide statistics', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 180.5, position: 1 },
        { vehicle_id: 'GR86-002-20', car_number: 20, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 10, max_speed: 175.3, position: 2 }
      ];
      insertVehicles(vehicles);

      const lapTimes = [
        { vehicle_id: 'GR86-001-10', lap: 1, lap_time: 150000, timestamp: '2024-03-15T14:00:00Z' },
        { vehicle_id: 'GR86-001-10', lap: 2, lap_time: 151000, timestamp: '2024-03-15T14:02:30Z' },
        { vehicle_id: 'GR86-002-20', lap: 1, lap_time: 155000, timestamp: '2024-03-15T14:00:00Z' }
      ];
      insertLapTimes(lapTimes);

      const response = await request(app)
        .get('/api/statistics/overview')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalVehicles).toBe(2);
      expect(response.body.data.totalLaps).toBe(3);
      expect(response.body.data.fastestLap).toBe(150000);
      expect(response.body.data.maxSpeed).toBe(180.5);
      expect(response.body.data.classDist).toBeDefined();
      expect(Array.isArray(response.body.data.classDist)).toBe(true);
    });

    it('should cache overview statistics', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 180.5, position: 1 }
      ];
      insertVehicles(vehicles);

      // First request - should hit database
      const response1 = await request(app).get('/api/statistics/overview').expect(200);
      expect(response1.body.meta.responseTime).toBeDefined();
      
      const statsAfterFirst = cache.getStats();
      expect(statsAfterFirst.sets).toBeGreaterThan(0);

      // Second request - should hit cache
      const response2 = await request(app).get('/api/statistics/overview').expect(200);
      expect(response2.body.meta.cached).toBe(true);
      
      const statsAfterSecond = cache.getStats();
      expect(statsAfterSecond.hits).toBeGreaterThan(0);
    });

    it('should return statistics with class distribution', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 180.5, position: 1 },
        { vehicle_id: 'GR86-002-20', car_number: 20, class: 'Pro', fastest_lap: 151000, average_lap: 153000, total_laps: 10, max_speed: 179.8, position: 2 },
        { vehicle_id: 'GR86-003-30', car_number: 30, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 10, max_speed: 175.3, position: 3 }
      ];
      insertVehicles(vehicles);

      const response = await request(app)
        .get('/api/statistics/overview')
        .expect(200);

      expect(response.body.data.classDist).toBeDefined();
      expect(response.body.data.classDist.length).toBe(2);
      
      const proClass = response.body.data.classDist.find(c => c.class === 'Pro');
      const amClass = response.body.data.classDist.find(c => c.class === 'Am');
      
      expect(proClass.count).toBe(2);
      expect(amClass.count).toBe(1);
    });
  });

  describe('GET /api/statistics/vehicle/:vehicleId', () => {
    // Example 19: Vehicle statistics
    // Validates: Requirements 13.2
    it('should return pre-computed vehicle statistics', async () => {
      const vehicle = {
        vehicle_id: 'GR86-004-78',
        car_number: 78,
        class: 'Am',
        fastest_lap: 148630,
        average_lap: 152400,
        total_laps: 45,
        max_speed: 185.3,
        position: 5
      };
      insertVehicles([vehicle]);

      const lapTimes = [
        { vehicle_id: 'GR86-004-78', lap: 1, lap_time: 148630, timestamp: '2024-03-15T14:00:00Z' },
        { vehicle_id: 'GR86-004-78', lap: 2, lap_time: 150000, timestamp: '2024-03-15T14:02:30Z' },
        { vehicle_id: 'GR86-004-78', lap: 3, lap_time: 155000, timestamp: '2024-03-15T14:05:00Z' }
      ];
      insertLapTimes(lapTimes);

      const sections = [
        { vehicle_id: 'GR86-004-78', lap: 1, s1: 45000, s2: 50000, s3: 53630, lap_time: 148630, top_speed: 185.3 }
      ];
      insertSectionTimes(sections);

      const response = await request(app)
        .get('/api/statistics/vehicle/GR86-004-78')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.vehicleId).toBe('GR86-004-78');
      expect(response.body.data.carNumber).toBe(78);
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.statistics.fastestLap).toBe(148630);
      expect(response.body.data.statistics.totalLaps).toBe(45);
      expect(response.body.data.statistics.maxSpeed).toBe(185.3);
    });

    it('should include section statistics when available', async () => {
      const vehicle = {
        vehicle_id: 'GR86-004-78',
        car_number: 78,
        class: 'Am',
        fastest_lap: 148630,
        average_lap: 152400,
        total_laps: 45,
        max_speed: 185.3,
        position: 5
      };
      insertVehicles([vehicle]);

      const sections = [
        { vehicle_id: 'GR86-004-78', lap: 1, s1: 45000, s2: 50000, s3: 53630, lap_time: 148630, top_speed: 185.3 },
        { vehicle_id: 'GR86-004-78', lap: 2, s1: 46000, s2: 51000, s3: 54000, lap_time: 151000, top_speed: 183.5 }
      ];
      insertSectionTimes(sections);

      const response = await request(app)
        .get('/api/statistics/vehicle/GR86-004-78')
        .expect(200);

      expect(response.body.data.statistics.sections).toBeDefined();
      expect(response.body.data.statistics.sections.fastestS1).toBe(45000);
      expect(response.body.data.statistics.sections.fastestS2).toBe(50000);
      expect(response.body.data.statistics.sections.fastestS3).toBe(53630);
    });

    it('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .get('/api/statistics/vehicle/GR86-999-99')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VEHICLE_NOT_FOUND');
    });

    it('should return 400 for invalid vehicle ID format', async () => {
      const response = await request(app)
        .get('/api/statistics/vehicle/INVALID-ID')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should cache vehicle statistics', async () => {
      const vehicle = {
        vehicle_id: 'GR86-004-78',
        car_number: 78,
        class: 'Am',
        fastest_lap: 148630,
        average_lap: 152400,
        total_laps: 45,
        max_speed: 185.3,
        position: 5
      };
      insertVehicles([vehicle]);

      // First request - should hit database
      const response1 = await request(app).get('/api/statistics/vehicle/GR86-004-78').expect(200);
      expect(response1.body.meta.responseTime).toBeDefined();
      
      const statsAfterFirst = cache.getStats();
      expect(statsAfterFirst.sets).toBeGreaterThan(0);

      // Second request - should hit cache
      const response2 = await request(app).get('/api/statistics/vehicle/GR86-004-78').expect(200);
      expect(response2.body.meta.cached).toBe(true);
      
      const statsAfterSecond = cache.getStats();
      expect(statsAfterSecond.hits).toBeGreaterThan(0);
    });
  });

  describe('GET /api/statistics/leaderboard', () => {
    it('should return leaderboard sorted by fastest lap', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 155000, average_lap: 157000, total_laps: 10, max_speed: 180.5, position: 3 },
        { vehicle_id: 'GR86-002-20', car_number: 20, class: 'Am', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 175.3, position: 1 },
        { vehicle_id: 'GR86-003-30', car_number: 30, class: 'Pro', fastest_lap: 152000, average_lap: 154000, total_laps: 10, max_speed: 179.8, position: 2 }
      ];
      insertVehicles(vehicles);

      const response = await request(app)
        .get('/api/statistics/leaderboard')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
      
      // Verify ranking
      expect(response.body.data[0].rank).toBe(1);
      expect(response.body.data[0].fastestLap).toBe(150000);
      expect(response.body.data[1].rank).toBe(2);
      expect(response.body.data[1].fastestLap).toBe(152000);
      expect(response.body.data[2].rank).toBe(3);
      expect(response.body.data[2].fastestLap).toBe(155000);
    });

    it('should support sorting by different fields', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 175.3, position: 1 },
        { vehicle_id: 'GR86-002-20', car_number: 20, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 10, max_speed: 180.5, position: 2 },
        { vehicle_id: 'GR86-003-30', car_number: 30, class: 'Pro', fastest_lap: 152000, average_lap: 154000, total_laps: 10, max_speed: 179.8, position: 3 }
      ];
      insertVehicles(vehicles);

      const response = await request(app)
        .get('/api/statistics/leaderboard?sortBy=max_speed&order=desc')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].maxSpeed).toBe(180.5);
      expect(response.body.data[1].maxSpeed).toBe(179.8);
      expect(response.body.data[2].maxSpeed).toBe(175.3);
      expect(response.body.meta.sortBy).toBe('max_speed');
      expect(response.body.meta.order).toBe('desc');
    });

    it('should filter leaderboard by class', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 180.5, position: 1 },
        { vehicle_id: 'GR86-002-20', car_number: 20, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 10, max_speed: 175.3, position: 2 },
        { vehicle_id: 'GR86-003-30', car_number: 30, class: 'Pro', fastest_lap: 152000, average_lap: 154000, total_laps: 10, max_speed: 179.8, position: 3 }
      ];
      insertVehicles(vehicles);

      const response = await request(app)
        .get('/api/statistics/leaderboard?class=Pro')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(v => v.class === 'Pro')).toBe(true);
      expect(response.body.meta.class).toBe('Pro');
    });

    it('should respect limit parameter', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 180.5, position: 1 },
        { vehicle_id: 'GR86-002-20', car_number: 20, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 10, max_speed: 175.3, position: 2 },
        { vehicle_id: 'GR86-003-30', car_number: 30, class: 'Pro', fastest_lap: 152000, average_lap: 154000, total_laps: 10, max_speed: 179.8, position: 3 }
      ];
      insertVehicles(vehicles);

      const response = await request(app)
        .get('/api/statistics/leaderboard?limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should cache leaderboard results', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 180.5, position: 1 }
      ];
      insertVehicles(vehicles);

      // First request - should hit database
      const response1 = await request(app).get('/api/statistics/leaderboard').expect(200);
      expect(response1.body.meta.responseTime).toBeDefined();
      
      const statsAfterFirst = cache.getStats();
      expect(statsAfterFirst.sets).toBeGreaterThan(0);

      // Second request - should hit cache
      const response2 = await request(app).get('/api/statistics/leaderboard').expect(200);
      expect(response2.body.meta.cached).toBe(true);
      
      const statsAfterSecond = cache.getStats();
      expect(statsAfterSecond.hits).toBeGreaterThan(0);
    });

    it('should return 400 for invalid sort field', async () => {
      const response = await request(app)
        .get('/api/statistics/leaderboard?sortBy=invalid_field')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/statistics/leaderboard?limit=200')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
