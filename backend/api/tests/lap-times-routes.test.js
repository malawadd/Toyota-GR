/**
 * Lap Times Routes Tests
 * Integration tests for lap times API endpoints
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import { CacheManager } from '../cache/cache-manager.js';
import lapTimesRoutes from '../routes/lap-times.js';
import { errorHandler } from '../middleware/error-handler.js';

describe('Lap Times Routes', () => {
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
    app.use('/api/lap-times', lapTimesRoutes);
    
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

    for (const lapTime of lapTimes) {
      stmt.run(
        lapTime.vehicle_id,
        lapTime.lap,
        lapTime.lap_time,
        lapTime.timestamp || null
      );
    }
  }

  describe('GET /api/lap-times', () => {
    // Example 3: Lap times endpoint
    // Validates: Requirements 1.3
    it('should return lap timing data with success response', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 3, max_speed: 180.5, position: 1 }
      ];
      insertVehicles(vehicles);

      const lapTimes = [
        { vehicle_id: 'GR86-001-10', lap: 1, lap_time: 152000, timestamp: '2024-03-15T14:00:00.000Z' },
        { vehicle_id: 'GR86-001-10', lap: 2, lap_time: 150000, timestamp: '2024-03-15T14:02:30.000Z' },
        { vehicle_id: 'GR86-001-10', lap: 3, lap_time: 151000, timestamp: '2024-03-15T14:05:00.000Z' }
      ];
      insertLapTimes(lapTimes);

      const response = await request(app)
        .get('/api/lap-times?vehicleId=GR86-001-10')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.total).toBe(3);
    });

    it('should return lap times with proper structure', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 1, max_speed: 180.5, position: 1 }
      ];
      insertVehicles(vehicles);

      const lapTimes = [
        { vehicle_id: 'GR86-001-10', lap: 1, lap_time: 152000, timestamp: '2024-03-15T14:00:00.000Z' }
      ];
      insertLapTimes(lapTimes);

      const response = await request(app)
        .get('/api/lap-times?vehicleId=GR86-001-10')
        .expect(200);

      const lapTime = response.body.data[0];
      expect(lapTime).toHaveProperty('id');
      expect(lapTime).toHaveProperty('vehicle_id');
      expect(lapTime).toHaveProperty('lap');
      expect(lapTime).toHaveProperty('lap_time');
      expect(lapTime).toHaveProperty('timestamp');
    });

    it('should filter lap times by vehicle ID', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 2, max_speed: 180.5, position: 1 },
        { vehicle_id: 'GR86-002-20', car_number: 20, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 2, max_speed: 175.3, position: 2 }
      ];
      insertVehicles(vehicles);

      const lapTimes = [
        { vehicle_id: 'GR86-001-10', lap: 1, lap_time: 152000, timestamp: '2024-03-15T14:00:00.000Z' },
        { vehicle_id: 'GR86-001-10', lap: 2, lap_time: 150000, timestamp: '2024-03-15T14:02:30.000Z' },
        { vehicle_id: 'GR86-002-20', lap: 1, lap_time: 157000, timestamp: '2024-03-15T14:00:00.000Z' },
        { vehicle_id: 'GR86-002-20', lap: 2, lap_time: 155000, timestamp: '2024-03-15T14:02:30.000Z' }
      ];
      insertLapTimes(lapTimes);

      const response = await request(app)
        .get('/api/lap-times?vehicleId=GR86-001-10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(lap => lap.vehicle_id === 'GR86-001-10')).toBe(true);
    });

    it('should filter lap times by lap range', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 5, max_speed: 180.5, position: 1 }
      ];
      insertVehicles(vehicles);

      const lapTimes = [
        { vehicle_id: 'GR86-001-10', lap: 1, lap_time: 152000, timestamp: '2024-03-15T14:00:00.000Z' },
        { vehicle_id: 'GR86-001-10', lap: 2, lap_time: 150000, timestamp: '2024-03-15T14:02:30.000Z' },
        { vehicle_id: 'GR86-001-10', lap: 3, lap_time: 151000, timestamp: '2024-03-15T14:05:00.000Z' },
        { vehicle_id: 'GR86-001-10', lap: 4, lap_time: 149000, timestamp: '2024-03-15T14:07:30.000Z' },
        { vehicle_id: 'GR86-001-10', lap: 5, lap_time: 150500, timestamp: '2024-03-15T14:10:00.000Z' }
      ];
      insertLapTimes(lapTimes);

      const response = await request(app)
        .get('/api/lap-times?vehicleId=GR86-001-10&minLap=2&maxLap=4')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data.every(lap => lap.lap >= 2 && lap.lap <= 4)).toBe(true);
    });

    it('should return 400 for invalid lap range', async () => {
      const response = await request(app)
        .get('/api/lap-times?vehicleId=GR86-001-10&minLap=5&maxLap=2')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('INVALID_LAP_RANGE');
    });

    it('should paginate lap times', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 180.5, position: 1 }
      ];
      insertVehicles(vehicles);

      const lapTimes = [];
      for (let i = 1; i <= 10; i++) {
        lapTimes.push({
          vehicle_id: 'GR86-001-10',
          lap: i,
          lap_time: 150000 + i * 100,
          timestamp: `2024-03-15T14:${String(i * 2).padStart(2, '0')}:00.000Z`
        });
      }
      insertLapTimes(lapTimes);

      const response = await request(app)
        .get('/api/lap-times?vehicleId=GR86-001-10&page=2&limit=3')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.limit).toBe(3);
      expect(response.body.meta.total).toBe(10);
      expect(response.body.meta.totalPages).toBe(4);
      expect(response.body.meta.hasNext).toBe(true);
      expect(response.body.meta.hasPrev).toBe(true);
    });

    it('should return empty array when no lap times exist', async () => {
      const response = await request(app)
        .get('/api/lap-times?vehicleId=GR86-999-99')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });
  });

  describe('GET /api/lap-times/vehicle/:vehicleId', () => {
    it('should return lap times for specific vehicle', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-004-78', car_number: 78, class: 'Am', fastest_lap: 148630, average_lap: 152400, total_laps: 3, max_speed: 185.3, position: 5 }
      ];
      insertVehicles(vehicles);

      const lapTimes = [
        { vehicle_id: 'GR86-004-78', lap: 1, lap_time: 152400, timestamp: '2024-03-15T14:00:00.000Z' },
        { vehicle_id: 'GR86-004-78', lap: 2, lap_time: 148630, timestamp: '2024-03-15T14:02:30.000Z' },
        { vehicle_id: 'GR86-004-78', lap: 3, lap_time: 150000, timestamp: '2024-03-15T14:05:00.000Z' }
      ];
      insertLapTimes(lapTimes);

      const response = await request(app)
        .get('/api/lap-times/vehicle/GR86-004-78')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(3);
      expect(response.body.data.every(lap => lap.vehicle_id === 'GR86-004-78')).toBe(true);
    });

    it('should return 400 for invalid vehicle ID format', async () => {
      const response = await request(app)
        .get('/api/lap-times/vehicle/INVALID-ID')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should support lap range filtering', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-004-78', car_number: 78, class: 'Am', fastest_lap: 148630, average_lap: 152400, total_laps: 5, max_speed: 185.3, position: 5 }
      ];
      insertVehicles(vehicles);

      const lapTimes = [];
      for (let i = 1; i <= 5; i++) {
        lapTimes.push({
          vehicle_id: 'GR86-004-78',
          lap: i,
          lap_time: 150000 + i * 100,
          timestamp: `2024-03-15T14:${String(i * 2).padStart(2, '0')}:00.000Z`
        });
      }
      insertLapTimes(lapTimes);

      const response = await request(app)
        .get('/api/lap-times/vehicle/GR86-004-78?minLap=2&maxLap=4')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data.every(lap => lap.lap >= 2 && lap.lap <= 4)).toBe(true);
    });
  });

  describe('GET /api/lap-times/fastest', () => {
    it('should return fastest lap times', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 148000, average_lap: 152000, total_laps: 2, max_speed: 180.5, position: 1 },
        { vehicle_id: 'GR86-002-20', car_number: 20, class: 'Am', fastest_lap: 150000, average_lap: 155000, total_laps: 2, max_speed: 175.3, position: 2 },
        { vehicle_id: 'GR86-003-30', car_number: 30, class: 'Pro', fastest_lap: 149000, average_lap: 153000, total_laps: 2, max_speed: 179.8, position: 3 }
      ];
      insertVehicles(vehicles);

      const lapTimes = [
        { vehicle_id: 'GR86-001-10', lap: 1, lap_time: 152000, timestamp: '2024-03-15T14:00:00.000Z' },
        { vehicle_id: 'GR86-001-10', lap: 2, lap_time: 148000, timestamp: '2024-03-15T14:02:30.000Z' },
        { vehicle_id: 'GR86-002-20', lap: 1, lap_time: 155000, timestamp: '2024-03-15T14:00:00.000Z' },
        { vehicle_id: 'GR86-002-20', lap: 2, lap_time: 150000, timestamp: '2024-03-15T14:02:30.000Z' },
        { vehicle_id: 'GR86-003-30', lap: 1, lap_time: 153000, timestamp: '2024-03-15T14:00:00.000Z' },
        { vehicle_id: 'GR86-003-30', lap: 2, lap_time: 149000, timestamp: '2024-03-15T14:02:30.000Z' }
      ];
      insertLapTimes(lapTimes);

      const response = await request(app)
        .get('/api/lap-times/fastest?limit=3')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(3);
      
      // Verify sorted by fastest lap time
      const lapTimes_result = response.body.data.map(lap => lap.lap_time);
      for (let i = 0; i < lapTimes_result.length - 1; i++) {
        expect(lapTimes_result[i]).toBeLessThanOrEqual(lapTimes_result[i + 1]);
      }
    });

    it('should filter fastest laps by vehicle class', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 148000, average_lap: 152000, total_laps: 1, max_speed: 180.5, position: 1 },
        { vehicle_id: 'GR86-002-20', car_number: 20, class: 'Am', fastest_lap: 150000, average_lap: 155000, total_laps: 1, max_speed: 175.3, position: 2 },
        { vehicle_id: 'GR86-003-30', car_number: 30, class: 'Pro', fastest_lap: 149000, average_lap: 153000, total_laps: 1, max_speed: 179.8, position: 3 }
      ];
      insertVehicles(vehicles);

      const lapTimes = [
        { vehicle_id: 'GR86-001-10', lap: 1, lap_time: 148000, timestamp: '2024-03-15T14:00:00.000Z' },
        { vehicle_id: 'GR86-002-20', lap: 1, lap_time: 150000, timestamp: '2024-03-15T14:00:00.000Z' },
        { vehicle_id: 'GR86-003-30', lap: 1, lap_time: 149000, timestamp: '2024-03-15T14:00:00.000Z' }
      ];
      insertLapTimes(lapTimes);

      const response = await request(app)
        .get('/api/lap-times/fastest?class=Pro')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(lap => lap.class === 'Pro')).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 148000, average_lap: 152000, total_laps: 1, max_speed: 180.5, position: 1 }
      ];
      insertVehicles(vehicles);

      const lapTimes = [];
      for (let i = 1; i <= 20; i++) {
        lapTimes.push({
          vehicle_id: 'GR86-001-10',
          lap: i,
          lap_time: 150000 + i * 100,
          timestamp: `2024-03-15T14:${String(i * 2).padStart(2, '0')}:00.000Z`
        });
      }
      insertLapTimes(lapTimes);

      const response = await request(app)
        .get('/api/lap-times/fastest?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(5);
    });
  });

  describe('GET /api/lap-times/compare', () => {
    it('should compare lap times for multiple vehicles', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 148000, average_lap: 152000, total_laps: 2, max_speed: 180.5, position: 1 },
        { vehicle_id: 'GR86-002-20', car_number: 20, class: 'Am', fastest_lap: 150000, average_lap: 155000, total_laps: 2, max_speed: 175.3, position: 2 }
      ];
      insertVehicles(vehicles);

      const lapTimes = [
        { vehicle_id: 'GR86-001-10', lap: 1, lap_time: 152000, timestamp: '2024-03-15T14:00:00.000Z' },
        { vehicle_id: 'GR86-001-10', lap: 2, lap_time: 148000, timestamp: '2024-03-15T14:02:30.000Z' },
        { vehicle_id: 'GR86-002-20', lap: 1, lap_time: 155000, timestamp: '2024-03-15T14:00:00.000Z' },
        { vehicle_id: 'GR86-002-20', lap: 2, lap_time: 150000, timestamp: '2024-03-15T14:02:30.000Z' }
      ];
      insertLapTimes(lapTimes);

      const response = await request(app)
        .get('/api/lap-times/compare?vehicleIds=GR86-001-10,GR86-002-20')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data['GR86-001-10']).toBeDefined();
      expect(response.body.data['GR86-002-20']).toBeDefined();
      expect(response.body.data['GR86-001-10'].length).toBe(2);
      expect(response.body.data['GR86-002-20'].length).toBe(2);
      expect(response.body.meta.vehicleCount).toBe(2);
      expect(response.body.meta.totalLaps).toBe(4);
    });

    it('should return 400 when vehicleIds parameter is missing', async () => {
      const response = await request(app)
        .get('/api/lap-times/compare')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid vehicle ID format in comparison', async () => {
      const response = await request(app)
        .get('/api/lap-times/compare?vehicleIds=INVALID-ID,GR86-001-10')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should support lap range filtering in comparison', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 148000, average_lap: 152000, total_laps: 5, max_speed: 180.5, position: 1 },
        { vehicle_id: 'GR86-002-20', car_number: 20, class: 'Am', fastest_lap: 150000, average_lap: 155000, total_laps: 5, max_speed: 175.3, position: 2 }
      ];
      insertVehicles(vehicles);

      const lapTimes = [];
      for (let i = 1; i <= 5; i++) {
        lapTimes.push({
          vehicle_id: 'GR86-001-10',
          lap: i,
          lap_time: 150000 + i * 100,
          timestamp: `2024-03-15T14:${String(i * 2).padStart(2, '0')}:00.000Z`
        });
        lapTimes.push({
          vehicle_id: 'GR86-002-20',
          lap: i,
          lap_time: 155000 + i * 100,
          timestamp: `2024-03-15T14:${String(i * 2).padStart(2, '0')}:00.000Z`
        });
      }
      insertLapTimes(lapTimes);

      const response = await request(app)
        .get('/api/lap-times/compare?vehicleIds=GR86-001-10,GR86-002-20&minLap=2&maxLap=4')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data['GR86-001-10'].length).toBe(3);
      expect(response.body.data['GR86-002-20'].length).toBe(3);
      expect(response.body.data['GR86-001-10'].every(lap => lap.lap >= 2 && lap.lap <= 4)).toBe(true);
      expect(response.body.data['GR86-002-20'].every(lap => lap.lap >= 2 && lap.lap <= 4)).toBe(true);
    });

    it('should return empty arrays for vehicles with no laps', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 148000, average_lap: 152000, total_laps: 0, max_speed: 180.5, position: 1 },
        { vehicle_id: 'GR86-002-20', car_number: 20, class: 'Am', fastest_lap: 150000, average_lap: 155000, total_laps: 0, max_speed: 175.3, position: 2 }
      ];
      insertVehicles(vehicles);

      const response = await request(app)
        .get('/api/lap-times/compare?vehicleIds=GR86-001-10,GR86-002-20')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data['GR86-001-10']).toEqual([]);
      expect(response.body.data['GR86-002-20']).toEqual([]);
      expect(response.body.meta.totalLaps).toBe(0);
    });
  });
});
