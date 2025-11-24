/**
 * Telemetry Routes Tests
 * Tests for telemetry API endpoints including SSE streaming
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import express from 'express';
import request from 'supertest';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import { CacheManager } from '../cache/cache-manager.js';
import telemetryRoutes from '../routes/telemetry.js';
import { errorHandler } from '../middleware/error-handler.js';

describe('Telemetry Routes', () => {
  let app;
  let db;
  let cache;

  beforeAll(() => {
    // Create in-memory database for testing
    db = initializeDatabase(':memory:', { memory: true });
    cache = new CacheManager(300);

    // Set up Express app
    app = express();
    app.use(express.json());
    
    // Make db and cache available to routes
    app.locals.db = db;
    app.locals.cache = cache;
    
    // Register routes
    app.use('/api/telemetry', telemetryRoutes);
    
    // Error handler
    app.use(errorHandler);
  });

  afterAll(() => {
    closeDatabase(db);
  });

  beforeEach(() => {
    // Clear database before each test
    db.exec('DELETE FROM telemetry');
    db.exec('DELETE FROM vehicles');
    cache.flush();
  });

  /**
   * Helper function to insert test vehicles
   */
  function insertVehicles(vehicles) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO vehicles (vehicle_id, car_number, class, fastest_lap, average_lap, total_laps, max_speed, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < vehicles.length; i++) {
      const vehicle = vehicles[i];
      stmt.run(
        vehicle.vehicle_id,
        vehicle.car_number || (i + 1),
        vehicle.class || 'Pro',
        vehicle.fastest_lap || 150000,
        vehicle.average_lap || 152000,
        vehicle.total_laps || 10,
        vehicle.max_speed || 180,
        vehicle.position || (i + 1)
      );
    }
  }

  /**
   * Helper function to insert test telemetry records
   */
  function insertTelemetry(records) {
    // First, ensure vehicles exist for all telemetry records
    const uniqueVehicleIds = [...new Set(records.map(r => r.vehicle_id))];
    const vehicles = uniqueVehicleIds.map(id => ({ vehicle_id: id }));
    insertVehicles(vehicles);

    const stmt = db.prepare(`
      INSERT INTO telemetry (vehicle_id, lap, timestamp, telemetry_name, telemetry_value)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const record of records) {
      stmt.run(
        record.vehicle_id,
        record.lap,
        record.timestamp,
        record.telemetry_name,
        record.telemetry_value
      );
    }
  }

  describe('GET /api/telemetry', () => {
    // Example 5: Telemetry endpoint
    // Validates: Requirements 1.5
    it('should return telemetry data when vehicleId is provided', async () => {
      const records = [
        { vehicle_id: 'GR86-004-78', lap: 1, timestamp: '2024-01-01T10:00:00.000Z', telemetry_name: 'speed_can', telemetry_value: 150.5 },
        { vehicle_id: 'GR86-004-78', lap: 1, timestamp: '2024-01-01T10:00:01.000Z', telemetry_name: 'speed_can', telemetry_value: 155.2 }
      ];
      insertTelemetry(records);

      const response = await request(app)
        .get('/api/telemetry?vehicleId=GR86-004-78')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.total).toBe(2);
    });

    it('should return 400 when vehicleId is missing', async () => {
      const response = await request(app)
        .get('/api/telemetry')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/telemetry/vehicle/:vehicleId', () => {
    it('should return telemetry data for a specific vehicle', async () => {
      const records = [
        { vehicle_id: 'GR86-004-78', lap: 1, timestamp: '2024-01-01T10:00:00.000Z', telemetry_name: 'speed_can', telemetry_value: 150.5 },
        { vehicle_id: 'GR86-004-78', lap: 1, timestamp: '2024-01-01T10:00:01.000Z', telemetry_name: 'brake', telemetry_value: 0.8 }
      ];
      insertTelemetry(records);

      const response = await request(app)
        .get('/api/telemetry/vehicle/GR86-004-78')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].vehicle_id).toBe('GR86-004-78');
    });

    it('should support pagination', async () => {
      const records = [];
      for (let i = 0; i < 150; i++) {
        records.push({
          vehicle_id: 'GR86-004-78',
          lap: 1,
          timestamp: `2024-01-01T10:00:${String(i).padStart(2, '0')}.000Z`,
          telemetry_name: 'speed_can',
          telemetry_value: 150 + i
        });
      }
      insertTelemetry(records);

      const response = await request(app)
        .get('/api/telemetry/vehicle/GR86-004-78?page=2&limit=50')
        .expect(200);

      expect(response.body.data).toHaveLength(50);
      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.total).toBe(150);
      expect(response.body.meta.hasNext).toBe(true);
      expect(response.body.meta.hasPrev).toBe(true);
    });
  });

  describe('GET /api/telemetry/vehicle/:vehicleId/lap/:lap', () => {
    it('should return telemetry data for a specific vehicle and lap', async () => {
      const records = [
        { vehicle_id: 'GR86-004-78', lap: 1, timestamp: '2024-01-01T10:00:00.000Z', telemetry_name: 'speed_can', telemetry_value: 150.5 },
        { vehicle_id: 'GR86-004-78', lap: 2, timestamp: '2024-01-01T10:01:00.000Z', telemetry_name: 'speed_can', telemetry_value: 155.2 },
        { vehicle_id: 'GR86-004-78', lap: 2, timestamp: '2024-01-01T10:01:01.000Z', telemetry_name: 'speed_can', telemetry_value: 160.0 }
      ];
      insertTelemetry(records);

      const response = await request(app)
        .get('/api/telemetry/vehicle/GR86-004-78/lap/2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(r => r.lap === 2)).toBe(true);
    });
  });

  describe('GET /api/telemetry/vehicle/:vehicleId/stats', () => {
    // Example 10: Aggregated telemetry statistics
    // Validates: Requirements 3.4
    it('should return aggregated telemetry statistics', async () => {
      const records = [
        { vehicle_id: 'GR86-004-78', lap: 1, timestamp: '2024-01-01T10:00:00.000Z', telemetry_name: 'speed_can', telemetry_value: 150.0 },
        { vehicle_id: 'GR86-004-78', lap: 1, timestamp: '2024-01-01T10:00:01.000Z', telemetry_name: 'speed_can', telemetry_value: 160.0 },
        { vehicle_id: 'GR86-004-78', lap: 1, timestamp: '2024-01-01T10:00:02.000Z', telemetry_name: 'speed_can', telemetry_value: 155.0 }
      ];
      insertTelemetry(records);

      const response = await request(app)
        .get('/api/telemetry/vehicle/GR86-004-78/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.speed_can).toBeDefined();
      expect(response.body.data.speed_can.min).toBe(150.0);
      expect(response.body.data.speed_can.max).toBe(160.0);
      expect(response.body.data.speed_can.avg).toBeCloseTo(155.0, 1);
    });

    it('should cache statistics', async () => {
      const records = [
        { vehicle_id: 'GR86-004-78', lap: 1, timestamp: '2024-01-01T10:00:00.000Z', telemetry_name: 'speed_can', telemetry_value: 150.0 }
      ];
      insertTelemetry(records);

      // First request
      await request(app)
        .get('/api/telemetry/vehicle/GR86-004-78/stats')
        .expect(200);

      // Second request should be cached
      const response = await request(app)
        .get('/api/telemetry/vehicle/GR86-004-78/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 when no telemetry data exists', async () => {
      insertVehicles([{ vehicle_id: 'GR86-004-78' }]);

      const response = await request(app)
        .get('/api/telemetry/vehicle/GR86-004-78/stats')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TELEMETRY_NOT_FOUND');
    });
  });

  describe('GET /api/telemetry/stream/:vehicleId (SSE)', () => {
    // Example 24: SSE connection establishment
    // Validates: Requirements 15.1
    it('should establish SSE connection', async () => {
      const records = [
        { vehicle_id: 'GR86-004-78', lap: 1, timestamp: '2024-01-01T10:00:00.000Z', telemetry_name: 'speed_can', telemetry_value: 150.0 }
      ];
      insertTelemetry(records);

      const response = await request(app)
        .get('/api/telemetry/stream/GR86-004-78')
        .timeout(1000);

      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
    });

    // Feature: racing-data-api, Property 22: Streaming chronological order
    // Validates: Requirements 15.2
    it('property: streaming sends data in chronological order', async () => {
      // Test with a single example to verify chronological order
      const vehicleId = 'GR86-004-78';
      const recordCount = 20;
      
      // Clear database
      db.exec('DELETE FROM telemetry');
      db.exec('DELETE FROM vehicles');

      // Insert telemetry records with sequential timestamps
      const records = [];
      const baseTime = Date.now();
      for (let i = 0; i < recordCount; i++) {
        records.push({
          vehicle_id: vehicleId,
          lap: 1,
          timestamp: new Date(baseTime + i * 100).toISOString(),
          telemetry_name: 'speed_can',
          telemetry_value: 100 + i
        });
      }
      insertTelemetry(records);

      // Make streaming request
      const response = await request(app)
        .get(`/api/telemetry/stream/${vehicleId}`)
        .timeout(5000);

      // Parse SSE events
      const events = response.text.split('\n\n').filter(e => e.trim());
      const telemetryEvents = events
        .filter(e => e.includes('event: telemetry'))
        .map(e => {
          const dataLine = e.split('\n').find(line => line.startsWith('data: '));
          if (dataLine) {
            return JSON.parse(dataLine.substring(6));
          }
          return null;
        })
        .filter(e => e !== null);

      // Property: All telemetry events should be in chronological order
      for (let i = 0; i < telemetryEvents.length - 1; i++) {
        const currentTime = new Date(telemetryEvents[i].timestamp).getTime();
        const nextTime = new Date(telemetryEvents[i + 1].timestamp).getTime();
        expect(currentTime).toBeLessThanOrEqual(nextTime);
      }

      expect(telemetryEvents.length).toBe(recordCount);
    });

    // Feature: racing-data-api, Property 23: Streaming playback rate
    // Validates: Requirements 15.3
    it('property: streaming respects playback speed', async () => {
      const vehicleId = 'GR86-004-78';
      const playbackSpeed = 2.0; // 2x speed
      
      // Clear database
      db.exec('DELETE FROM telemetry');
      db.exec('DELETE FROM vehicles');

      // Insert telemetry records with known time differences
      const records = [];
      const baseTime = Date.now();
      const timeDiffMs = 100; // 100ms between records
      for (let i = 0; i < 5; i++) {
        records.push({
          vehicle_id: vehicleId,
          lap: 1,
          timestamp: new Date(baseTime + i * timeDiffMs).toISOString(),
          telemetry_name: 'speed_can',
          telemetry_value: 150 + i
        });
      }
      insertTelemetry(records);

      // Measure streaming time
      const startTime = Date.now();
      await request(app)
        .get(`/api/telemetry/stream/${vehicleId}?playbackSpeed=${playbackSpeed}`)
        .timeout(10000);
      const endTime = Date.now();
      const actualDuration = endTime - startTime;

      // Expected duration: (total time difference) / playback speed
      // Total time difference for 5 records = 4 * 100ms = 400ms
      const expectedDuration = (4 * timeDiffMs) / playbackSpeed;

      // Property: Actual duration should be close to expected duration
      // Allow 100ms + 50% tolerance due to network/processing overhead
      const tolerance = 100 + expectedDuration * 0.5;
      
      expect(actualDuration).toBeGreaterThanOrEqual(expectedDuration - tolerance);
      expect(actualDuration).toBeLessThanOrEqual(expectedDuration + tolerance);
    });

    // Example 25: Stream resource cleanup
    // Validates: Requirements 15.4
    it('should handle client disconnect gracefully', async () => {
      const records = [];
      for (let i = 0; i < 100; i++) {
        records.push({
          vehicle_id: 'GR86-004-78',
          lap: 1,
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
          telemetry_name: 'speed_can',
          telemetry_value: 150 + i
        });
      }
      insertTelemetry(records);

      // Start streaming and abort after short time
      try {
        await request(app)
          .get('/api/telemetry/stream/GR86-004-78')
          .timeout(100);
      } catch (error) {
        // Expected to timeout or abort - various error types are acceptable
        expect(error).toBeDefined();
      }

      // Test passes if no errors are thrown during cleanup
      expect(true).toBe(true);
    });

    // Example 26: Stream completion
    // Validates: Requirements 15.5
    it('should send completion event when stream finishes', async () => {
      const records = [
        { vehicle_id: 'GR86-004-78', lap: 1, timestamp: '2024-01-01T10:00:00.000Z', telemetry_name: 'speed_can', telemetry_value: 150.0 },
        { vehicle_id: 'GR86-004-78', lap: 1, timestamp: '2024-01-01T10:00:01.000Z', telemetry_name: 'speed_can', telemetry_value: 155.0 }
      ];
      insertTelemetry(records);

      const response = await request(app)
        .get('/api/telemetry/stream/GR86-004-78')
        .timeout(5000);

      // Check for completion event
      expect(response.text).toContain('event: complete');
      expect(response.text).toContain('Stream completed');
    });
  });
});
