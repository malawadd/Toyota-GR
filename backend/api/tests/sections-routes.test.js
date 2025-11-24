/**
 * Sections Routes Tests
 * Integration tests for section timing API endpoints
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import { CacheManager } from '../cache/cache-manager.js';
import sectionsRoutes from '../routes/sections.js';
import { errorHandler } from '../middleware/error-handler.js';

describe('Sections Routes', () => {
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
    app.use('/api/sections', sectionsRoutes);
    
    // Register error handler
    app.use(errorHandler);

    // Insert test vehicles for joins
    const vehicleStmt = db.prepare(`
      INSERT INTO vehicles (vehicle_id, car_number, class, fastest_lap, average_lap, total_laps, max_speed, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    vehicleStmt.run('GR86-001-10', 10, 'Pro', 150000, 152000, 10, 180.5, 1);
    vehicleStmt.run('GR86-002-20', 20, 'Am', 155000, 157000, 10, 175.3, 2);
    vehicleStmt.run('GR86-003-30', 30, 'Pro', 151000, 153000, 10, 179.8, 3);
  });

  afterEach(() => {
    closeDatabase(db);
    cache.flush();
  });

  /**
   * Helper function to insert test section times
   */
  function insertSections(sections) {
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

  describe('GET /api/sections', () => {
    it('should return fastest section times', async () => {
      const sections = [
        { vehicle_id: 'GR86-001-10', lap: 1, s1: 45.123, s2: 52.456, s3: 48.789, lap_time: 146.368, top_speed: 180.5 },
        { vehicle_id: 'GR86-002-20', lap: 1, s1: 46.234, s2: 53.567, s3: 49.890, lap_time: 149.691, top_speed: 175.3 },
        { vehicle_id: 'GR86-003-30', lap: 1, s1: 45.345, s2: 52.678, s3: 48.901, lap_time: 146.924, top_speed: 179.8 }
      ];
      insertSections(sections);

      const response = await request(app)
        .get('/api/sections?section=s1&limit=10')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta.section).toBe('s1');
    });

    it('should filter fastest sections by vehicle', async () => {
      const sections = [
        { vehicle_id: 'GR86-001-10', lap: 1, s1: 45.123, s2: 52.456, s3: 48.789, lap_time: 146.368, top_speed: 180.5 },
        { vehicle_id: 'GR86-001-10', lap: 2, s1: 45.234, s2: 52.567, s3: 48.890, lap_time: 146.691, top_speed: 180.3 },
        { vehicle_id: 'GR86-002-20', lap: 1, s1: 46.234, s2: 53.567, s3: 49.890, lap_time: 149.691, top_speed: 175.3 }
      ];
      insertSections(sections);

      const response = await request(app)
        .get('/api/sections?section=s1&vehicleId=GR86-001-10&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(s => s.vehicle_id === 'GR86-001-10')).toBe(true);
    });

    it('should filter fastest sections by class', async () => {
      const sections = [
        { vehicle_id: 'GR86-001-10', lap: 1, s1: 45.123, s2: 52.456, s3: 48.789, lap_time: 146.368, top_speed: 180.5 },
        { vehicle_id: 'GR86-002-20', lap: 1, s1: 46.234, s2: 53.567, s3: 49.890, lap_time: 149.691, top_speed: 175.3 },
        { vehicle_id: 'GR86-003-30', lap: 1, s1: 45.345, s2: 52.678, s3: 48.901, lap_time: 146.924, top_speed: 179.8 }
      ];
      insertSections(sections);

      const response = await request(app)
        .get('/api/sections?section=s1&class=Pro&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(s => s.class === 'Pro')).toBe(true);
    });

    it('should sort sections by time (fastest first)', async () => {
      const sections = [
        { vehicle_id: 'GR86-001-10', lap: 1, s1: 45.123, s2: 52.456, s3: 48.789, lap_time: 146.368, top_speed: 180.5 },
        { vehicle_id: 'GR86-002-20', lap: 1, s1: 46.234, s2: 53.567, s3: 49.890, lap_time: 149.691, top_speed: 175.3 },
        { vehicle_id: 'GR86-003-30', lap: 1, s1: 45.345, s2: 52.678, s3: 48.901, lap_time: 146.924, top_speed: 179.8 }
      ];
      insertSections(sections);

      const response = await request(app)
        .get('/api/sections?section=s1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      const s1Times = response.body.data.map(s => s.s1);
      for (let i = 0; i < s1Times.length - 1; i++) {
        expect(s1Times[i]).toBeLessThanOrEqual(s1Times[i + 1]);
      }
    });

    it('should return empty array when no sections exist', async () => {
      const response = await request(app)
        .get('/api/sections')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/sections/vehicle/:vehicleId', () => {
    it('should return section times for specific vehicle', async () => {
      const sections = [
        { vehicle_id: 'GR86-001-10', lap: 1, s1: 45.123, s2: 52.456, s3: 48.789, lap_time: 146.368, top_speed: 180.5 },
        { vehicle_id: 'GR86-001-10', lap: 2, s1: 45.234, s2: 52.567, s3: 48.890, lap_time: 146.691, top_speed: 180.3 },
        { vehicle_id: 'GR86-002-20', lap: 1, s1: 46.234, s2: 53.567, s3: 49.890, lap_time: 149.691, top_speed: 175.3 }
      ];
      insertSections(sections);

      const response = await request(app)
        .get('/api/sections/vehicle/GR86-001-10')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(s => s.vehicle_id === 'GR86-001-10')).toBe(true);
      expect(response.body.meta.total).toBe(2);
    });

    it('should filter sections by lap range', async () => {
      const sections = [
        { vehicle_id: 'GR86-001-10', lap: 1, s1: 45.123, s2: 52.456, s3: 48.789, lap_time: 146.368, top_speed: 180.5 },
        { vehicle_id: 'GR86-001-10', lap: 2, s1: 45.234, s2: 52.567, s3: 48.890, lap_time: 146.691, top_speed: 180.3 },
        { vehicle_id: 'GR86-001-10', lap: 3, s1: 45.345, s2: 52.678, s3: 48.901, lap_time: 146.924, top_speed: 180.1 },
        { vehicle_id: 'GR86-001-10', lap: 4, s1: 45.456, s2: 52.789, s3: 49.012, lap_time: 147.257, top_speed: 179.9 }
      ];
      insertSections(sections);

      const response = await request(app)
        .get('/api/sections/vehicle/GR86-001-10?minLap=2&maxLap=3')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].lap).toBe(2);
      expect(response.body.data[1].lap).toBe(3);
    });

    it('should paginate section times', async () => {
      const sections = [];
      for (let i = 1; i <= 150; i++) {
        sections.push({
          vehicle_id: 'GR86-001-10',
          lap: i,
          s1: 45.0 + i * 0.01,
          s2: 52.0 + i * 0.01,
          s3: 48.0 + i * 0.01,
          lap_time: 145.0 + i * 0.03,
          top_speed: 180.0
        });
      }
      insertSections(sections);

      const response = await request(app)
        .get('/api/sections/vehicle/GR86-001-10?page=2&limit=50')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(50);
      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.limit).toBe(50);
      expect(response.body.meta.total).toBe(150);
      expect(response.body.meta.totalPages).toBe(3);
    });

    it('should return 400 for invalid vehicle ID format', async () => {
      const response = await request(app)
        .get('/api/sections/vehicle/INVALID-ID')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid lap range', async () => {
      const response = await request(app)
        .get('/api/sections/vehicle/GR86-001-10?minLap=10&maxLap=5')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_LAP_RANGE');
    });

    it('should return empty array for vehicle with no sections', async () => {
      const response = await request(app)
        .get('/api/sections/vehicle/GR86-001-10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });
  });

  describe('GET /api/sections/vehicle/:vehicleId/lap/:lap', () => {
    it('should return section times for specific vehicle and lap', async () => {
      const sections = [
        { vehicle_id: 'GR86-001-10', lap: 1, s1: 45.123, s2: 52.456, s3: 48.789, lap_time: 146.368, top_speed: 180.5 },
        { vehicle_id: 'GR86-001-10', lap: 2, s1: 45.234, s2: 52.567, s3: 48.890, lap_time: 146.691, top_speed: 180.3 }
      ];
      insertSections(sections);

      const response = await request(app)
        .get('/api/sections/vehicle/GR86-001-10/lap/1')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.vehicle_id).toBe('GR86-001-10');
      expect(response.body.data.lap).toBe(1);
      expect(response.body.data.s1).toBe(45.123);
      expect(response.body.data.s2).toBe(52.456);
      expect(response.body.data.s3).toBe(48.789);
    });

    it('should return 404 for non-existent lap', async () => {
      const response = await request(app)
        .get('/api/sections/vehicle/GR86-001-10/lap/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SECTION_NOT_FOUND');
    });

    it('should return 400 for invalid vehicle ID format', async () => {
      const response = await request(app)
        .get('/api/sections/vehicle/INVALID-ID/lap/1')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid lap number', async () => {
      const response = await request(app)
        .get('/api/sections/vehicle/GR86-001-10/lap/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/sections/leaders', () => {
    it('should return section leaders for all sections', async () => {
      const sections = [
        { vehicle_id: 'GR86-001-10', lap: 1, s1: 45.123, s2: 52.456, s3: 48.789, lap_time: 146.368, top_speed: 180.5 },
        { vehicle_id: 'GR86-002-20', lap: 1, s1: 46.234, s2: 52.123, s3: 48.456, lap_time: 146.813, top_speed: 175.3 },
        { vehicle_id: 'GR86-003-30', lap: 1, s1: 45.345, s2: 52.678, s3: 48.234, lap_time: 146.257, top_speed: 179.8 }
      ];
      insertSections(sections);

      const response = await request(app)
        .get('/api/sections/leaders')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.s1).toBeDefined();
      expect(response.body.data.s2).toBeDefined();
      expect(response.body.data.s3).toBeDefined();
      
      // Verify s1 leader is the fastest
      expect(response.body.data.s1.vehicle_id).toBe('GR86-001-10');
      expect(response.body.data.s1.s1).toBe(45.123);
      
      // Verify s2 leader is the fastest
      expect(response.body.data.s2.vehicle_id).toBe('GR86-002-20');
      expect(response.body.data.s2.s2).toBe(52.123);
      
      // Verify s3 leader is the fastest
      expect(response.body.data.s3.vehicle_id).toBe('GR86-003-30');
      expect(response.body.data.s3.s3).toBe(48.234);
    });

    it('should filter leaders by class', async () => {
      const sections = [
        { vehicle_id: 'GR86-001-10', lap: 1, s1: 45.123, s2: 52.456, s3: 48.789, lap_time: 146.368, top_speed: 180.5 },
        { vehicle_id: 'GR86-002-20', lap: 1, s1: 44.999, s2: 52.123, s3: 48.456, lap_time: 145.578, top_speed: 175.3 },
        { vehicle_id: 'GR86-003-30', lap: 1, s1: 45.345, s2: 52.678, s3: 48.234, lap_time: 146.257, top_speed: 179.8 }
      ];
      insertSections(sections);

      const response = await request(app)
        .get('/api/sections/leaders?class=Pro')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.s1).toBeDefined();
      // Should only include Pro class vehicles
      expect(['GR86-001-10', 'GR86-003-30']).toContain(response.body.data.s1.vehicle_id);
    });

    it('should filter leaders by lap', async () => {
      const sections = [
        { vehicle_id: 'GR86-001-10', lap: 1, s1: 45.123, s2: 52.456, s3: 48.789, lap_time: 146.368, top_speed: 180.5 },
        { vehicle_id: 'GR86-001-10', lap: 2, s1: 44.999, s2: 52.123, s3: 48.456, lap_time: 145.578, top_speed: 180.3 }
      ];
      insertSections(sections);

      const response = await request(app)
        .get('/api/sections/leaders?lap=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.s1).toBeDefined();
      expect(response.body.data.s1.lap).toBe(2);
    });

    it('should return null for sections with no data', async () => {
      const response = await request(app)
        .get('/api/sections/leaders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.s1).toBeNull();
      expect(response.body.data.s2).toBeNull();
      expect(response.body.data.s3).toBeNull();
    });
  });
});
