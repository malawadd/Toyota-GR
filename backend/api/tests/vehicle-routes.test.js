/**
 * Vehicle Routes Tests
 * Integration tests for vehicle API endpoints
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import { CacheManager } from '../cache/cache-manager.js';
import vehicleRoutes from '../routes/vehicles.js';
import { errorHandler } from '../middleware/error-handler.js';

describe('Vehicle Routes', () => {
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
    app.use('/api/vehicles', vehicleRoutes);
    
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

  describe('GET /api/vehicles', () => {
    // Example 1: Vehicle list endpoint
    // Validates: Requirements 1.1
    it('should return vehicle list with success response', async () => {
      const vehicles = [
        { 
          vehicle_id: 'GR86-001-10', 
          car_number: 10, 
          class: 'Pro', 
          fastest_lap: 150000, 
          average_lap: 152000, 
          total_laps: 10, 
          max_speed: 180.5, 
          position: 1 
        },
        { 
          vehicle_id: 'GR86-002-20', 
          car_number: 20, 
          class: 'Am', 
          fastest_lap: 155000, 
          average_lap: 157000, 
          total_laps: 10, 
          max_speed: 175.3, 
          position: 2 
        }
      ];
      insertVehicles(vehicles);

      const response = await request(app)
        .get('/api/vehicles')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.total).toBe(2);
    });

    it('should return vehicles with proper structure', async () => {
      const vehicles = [
        { 
          vehicle_id: 'GR86-001-10', 
          car_number: 10, 
          class: 'Pro', 
          fastest_lap: 150000, 
          average_lap: 152000, 
          total_laps: 10, 
          max_speed: 180.5, 
          position: 1 
        }
      ];
      insertVehicles(vehicles);

      const response = await request(app)
        .get('/api/vehicles')
        .expect(200);

      const vehicle = response.body.data[0];
      expect(vehicle).toHaveProperty('vehicleId');
      expect(vehicle).toHaveProperty('carNumber');
      expect(vehicle).toHaveProperty('class');
      expect(vehicle).toHaveProperty('statistics');
      expect(vehicle.statistics).toHaveProperty('fastestLap');
      expect(vehicle.statistics).toHaveProperty('averageLap');
      expect(vehicle.statistics).toHaveProperty('totalLaps');
      expect(vehicle.statistics).toHaveProperty('maxSpeed');
      expect(vehicle.statistics).toHaveProperty('position');
    });

    it('should filter vehicles by class', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 180.5, position: 1 },
        { vehicle_id: 'GR86-002-20', car_number: 20, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 10, max_speed: 175.3, position: 2 },
        { vehicle_id: 'GR86-003-30', car_number: 30, class: 'Pro', fastest_lap: 151000, average_lap: 153000, total_laps: 10, max_speed: 179.8, position: 3 }
      ];
      insertVehicles(vehicles);

      const response = await request(app)
        .get('/api/vehicles?class=Pro')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(v => v.class === 'Pro')).toBe(true);
    });

    it('should sort vehicles by fastest lap', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 155000, average_lap: 157000, total_laps: 10, max_speed: 180.5, position: 3 },
        { vehicle_id: 'GR86-002-20', car_number: 20, class: 'Am', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 175.3, position: 1 },
        { vehicle_id: 'GR86-003-30', car_number: 30, class: 'Pro', fastest_lap: 152000, average_lap: 154000, total_laps: 10, max_speed: 179.8, position: 2 }
      ];
      insertVehicles(vehicles);

      const response = await request(app)
        .get('/api/vehicles?sortBy=fastest_lap&order=asc')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
      
      // Verify ascending order
      const lapTimes = response.body.data.map(v => v.statistics.fastestLap);
      for (let i = 0; i < lapTimes.length - 1; i++) {
        expect(lapTimes[i]).toBeLessThanOrEqual(lapTimes[i + 1]);
      }
    });

    it('should cache vehicle list', async () => {
      const vehicles = [
        { vehicle_id: 'GR86-001-10', car_number: 10, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 180.5, position: 1 }
      ];
      insertVehicles(vehicles);

      // First request - should hit database
      await request(app).get('/api/vehicles').expect(200);
      
      const statsAfterFirst = cache.getStats();
      expect(statsAfterFirst.sets).toBeGreaterThan(0);

      // Second request - should hit cache
      await request(app).get('/api/vehicles').expect(200);
      
      const statsAfterSecond = cache.getStats();
      expect(statsAfterSecond.hits).toBeGreaterThan(0);
    });

    it('should return empty array when no vehicles exist', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });
  });

  describe('GET /api/vehicles/:id', () => {
    // Example 2: Vehicle by ID endpoint
    // Validates: Requirements 1.2
    it('should return vehicle details for valid ID', async () => {
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

      const response = await request(app)
        .get('/api/vehicles/GR86-004-78')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.vehicleId).toBe('GR86-004-78');
      expect(response.body.data.carNumber).toBe(78);
      expect(response.body.data.class).toBe('Am');
    });

    // Example 12: Vehicle statistics included
    // Validates: Requirements 5.3
    it('should include statistics in vehicle details', async () => {
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

      const response = await request(app)
        .get('/api/vehicles/GR86-004-78')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.statistics.fastestLap).toBe(148630);
      expect(response.body.data.statistics.averageLap).toBe(152400);
      expect(response.body.data.statistics.totalLaps).toBe(45);
      expect(response.body.data.statistics.maxSpeed).toBe(185.3);
      expect(response.body.data.statistics.position).toBe(5);
    });

    it('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .get('/api/vehicles/GR86-999-99')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VEHICLE_NOT_FOUND');
      expect(response.body.error.message).toContain('GR86-999-99');
    });

    it('should return 400 for invalid vehicle ID format', async () => {
      const response = await request(app)
        .get('/api/vehicles/INVALID-ID')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should cache vehicle details', async () => {
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
      await request(app).get('/api/vehicles/GR86-004-78').expect(200);
      
      const statsAfterFirst = cache.getStats();
      expect(statsAfterFirst.sets).toBeGreaterThan(0);

      // Second request - should hit cache
      await request(app).get('/api/vehicles/GR86-004-78').expect(200);
      
      const statsAfterSecond = cache.getStats();
      expect(statsAfterSecond.hits).toBeGreaterThan(0);
    });
  });

  describe('GET /api/vehicles/by-number/:carNumber', () => {
    it('should return vehicle by car number', async () => {
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

      const response = await request(app)
        .get('/api/vehicles/by-number/78')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.vehicleId).toBe('GR86-004-78');
      expect(response.body.data.carNumber).toBe(78);
    });

    it('should return 404 for non-existent car number', async () => {
      const response = await request(app)
        .get('/api/vehicles/by-number/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VEHICLE_NOT_FOUND');
      expect(response.body.error.message).toContain('999');
    });

    it('should return 400 for invalid car number', async () => {
      const response = await request(app)
        .get('/api/vehicles/by-number/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should cache vehicle by car number', async () => {
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
      await request(app).get('/api/vehicles/by-number/78').expect(200);
      
      const statsAfterFirst = cache.getStats();
      expect(statsAfterFirst.sets).toBeGreaterThan(0);

      // Second request - should hit cache
      await request(app).get('/api/vehicles/by-number/78').expect(200);
      
      const statsAfterSecond = cache.getStats();
      expect(statsAfterSecond.hits).toBeGreaterThan(0);
    });
  });
});
