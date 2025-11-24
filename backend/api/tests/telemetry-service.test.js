/**
 * Telemetry Service Tests
 * Tests for telemetry service business logic with performance validation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import {
  getTelemetryByVehicle,
  getAggregatedTelemetry,
  getTelemetryStream
} from '../services/telemetry-service.js';

describe('Telemetry Service', () => {
  let db;

  beforeEach(() => {
    // Create in-memory database for testing
    db = initializeDatabase(':memory:', { memory: true });
  });

  afterEach(() => {
    closeDatabase(db);
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

  describe('getTelemetryByVehicle', () => {
    it('should return telemetry data for a vehicle', () => {
      const records = [
        { vehicle_id: 'GR86-001', lap: 1, timestamp: '2024-01-01T10:00:00.000Z', telemetry_name: 'speed_can', telemetry_value: 150.5 },
        { vehicle_id: 'GR86-001', lap: 1, timestamp: '2024-01-01T10:00:01.000Z', telemetry_name: 'speed_can', telemetry_value: 155.2 },
        { vehicle_id: 'GR86-002', lap: 1, timestamp: '2024-01-01T10:00:00.000Z', telemetry_name: 'speed_can', telemetry_value: 145.0 }
      ];
      insertTelemetry(records);

      const result = getTelemetryByVehicle(db, 'GR86-001');
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0].vehicle_id).toBe('GR86-001');
    });

    it('should filter by lap number', () => {
      const records = [
        { vehicle_id: 'GR86-001', lap: 1, timestamp: '2024-01-01T10:00:00.000Z', telemetry_name: 'speed_can', telemetry_value: 150.5 },
        { vehicle_id: 'GR86-001', lap: 2, timestamp: '2024-01-01T10:01:00.000Z', telemetry_name: 'speed_can', telemetry_value: 155.2 },
        { vehicle_id: 'GR86-001', lap: 2, timestamp: '2024-01-01T10:01:01.000Z', telemetry_name: 'speed_can', telemetry_value: 160.0 }
      ];
      insertTelemetry(records);

      const result = getTelemetryByVehicle(db, 'GR86-001', { lap: 2 });
      expect(result.data).toHaveLength(2);
      expect(result.data.every(r => r.lap === 2)).toBe(true);
    });

    it('should filter by telemetry names', () => {
      const records = [
        { vehicle_id: 'GR86-001', lap: 1, timestamp: '2024-01-01T10:00:00.000Z', telemetry_name: 'speed_can', telemetry_value: 150.5 },
        { vehicle_id: 'GR86-001', lap: 1, timestamp: '2024-01-01T10:00:01.000Z', telemetry_name: 'brake', telemetry_value: 0.8 },
        { vehicle_id: 'GR86-001', lap: 1, timestamp: '2024-01-01T10:00:02.000Z', telemetry_name: 'throttle', telemetry_value: 0.95 }
      ];
      insertTelemetry(records);

      const result = getTelemetryByVehicle(db, 'GR86-001', { telemetryNames: ['speed_can', 'brake'] });
      expect(result.data).toHaveLength(2);
      expect(result.data.every(r => ['speed_can', 'brake'].includes(r.telemetry_name))).toBe(true);
    });

    it('should support pagination', () => {
      const records = [];
      for (let i = 0; i < 150; i++) {
        records.push({
          vehicle_id: 'GR86-001',
          lap: 1,
          timestamp: `2024-01-01T10:00:${String(i).padStart(2, '0')}.000Z`,
          telemetry_name: 'speed_can',
          telemetry_value: 150 + i
        });
      }
      insertTelemetry(records);

      const page1 = getTelemetryByVehicle(db, 'GR86-001', { limit: 50, offset: 0 });
      const page2 = getTelemetryByVehicle(db, 'GR86-001', { limit: 50, offset: 50 });

      expect(page1.data).toHaveLength(50);
      expect(page2.data).toHaveLength(50);
      expect(page1.total).toBe(150);
      expect(page2.total).toBe(150);
      expect(page1.data[0].id).not.toBe(page2.data[0].id);
    });

    // Feature: racing-data-api, Property 2: Telemetry query performance
    // Validates: Requirements 3.1
    it('property: telemetry queries complete in less than 100ms', () => {
      fc.assert(
        fc.property(
          // Generate a vehicle ID
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `GR86-${s}`),
          // Generate telemetry records (simulate realistic dataset)
          fc.integer({ min: 100, max: 1000 }),
          (vehicleId, recordCount) => {
            // Clear database (must clear telemetry first due to foreign key)
            db.exec('DELETE FROM telemetry');
            db.exec('DELETE FROM vehicles');

            // Insert telemetry records
            const records = [];
            for (let i = 0; i < recordCount; i++) {
              records.push({
                vehicle_id: vehicleId,
                lap: Math.floor(i / 50) + 1,
                timestamp: new Date(Date.now() + i * 1000).toISOString(),
                telemetry_name: ['speed_can', 'brake', 'throttle', 'gear'][i % 4],
                telemetry_value: 100 + Math.random() * 100
              });
            }
            insertTelemetry(records);

            // Measure query performance
            const startTime = performance.now();
            const result = getTelemetryByVehicle(db, vehicleId, { limit: 100 });
            const endTime = performance.now();
            const duration = endTime - startTime;

            // Property: Query should complete in less than 100ms
            return duration < 100 && result.data.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getAggregatedTelemetry', () => {
    it('should return aggregated statistics', () => {
      const records = [
        { vehicle_id: 'GR86-001', lap: 1, timestamp: '2024-01-01T10:00:00.000Z', telemetry_name: 'speed_can', telemetry_value: 150.0 },
        { vehicle_id: 'GR86-001', lap: 1, timestamp: '2024-01-01T10:00:01.000Z', telemetry_name: 'speed_can', telemetry_value: 160.0 },
        { vehicle_id: 'GR86-001', lap: 1, timestamp: '2024-01-01T10:00:02.000Z', telemetry_name: 'speed_can', telemetry_value: 155.0 }
      ];
      insertTelemetry(records);

      const result = getAggregatedTelemetry(db, 'GR86-001');
      expect(result).not.toBeNull();
      expect(result.speed_can).toBeDefined();
      expect(result.speed_can.min).toBe(150.0);
      expect(result.speed_can.max).toBe(160.0);
      expect(result.speed_can.avg).toBeCloseTo(155.0, 1);
    });

    it('should filter by lap when specified', () => {
      const records = [
        { vehicle_id: 'GR86-001', lap: 1, timestamp: '2024-01-01T10:00:00.000Z', telemetry_name: 'speed_can', telemetry_value: 150.0 },
        { vehicle_id: 'GR86-001', lap: 2, timestamp: '2024-01-01T10:01:00.000Z', telemetry_name: 'speed_can', telemetry_value: 170.0 },
        { vehicle_id: 'GR86-001', lap: 2, timestamp: '2024-01-01T10:01:01.000Z', telemetry_name: 'speed_can', telemetry_value: 180.0 }
      ];
      insertTelemetry(records);

      const result = getAggregatedTelemetry(db, 'GR86-001', 2);
      expect(result).not.toBeNull();
      expect(result.speed_can.min).toBe(170.0);
      expect(result.speed_can.max).toBe(180.0);
    });

    it('should return null when no data exists', () => {
      const result = getAggregatedTelemetry(db, 'NON-EXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('getTelemetryStream', () => {
    it('should stream telemetry data in batches', async () => {
      const records = [];
      for (let i = 0; i < 2500; i++) {
        records.push({
          vehicle_id: 'GR86-001',
          lap: Math.floor(i / 100) + 1,
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
          telemetry_name: 'speed_can',
          telemetry_value: 150 + Math.random() * 50
        });
      }
      insertTelemetry(records);

      const batches = [];
      for await (const batch of getTelemetryStream(db, 'GR86-001', { batchSize: 1000 })) {
        batches.push(batch);
      }

      expect(batches.length).toBe(3); // 2500 records / 1000 per batch = 3 batches
      expect(batches[0].length).toBe(1000);
      expect(batches[1].length).toBe(1000);
      expect(batches[2].length).toBe(500);
    });

    it('should stream in chronological order', async () => {
      const records = [];
      for (let i = 0; i < 100; i++) {
        records.push({
          vehicle_id: 'GR86-001',
          lap: 1,
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
          telemetry_name: 'speed_can',
          telemetry_value: 150 + i
        });
      }
      insertTelemetry(records);

      const allRecords = [];
      for await (const batch of getTelemetryStream(db, 'GR86-001', { batchSize: 50 })) {
        allRecords.push(...batch);
      }

      // Verify chronological order
      for (let i = 0; i < allRecords.length - 1; i++) {
        expect(new Date(allRecords[i].timestamp).getTime())
          .toBeLessThanOrEqual(new Date(allRecords[i + 1].timestamp).getTime());
      }
    });
  });

  describe('Pagination Property Tests', () => {
    // Feature: racing-data-api, Property 3: Pagination correctness
    // Validates: Requirements 3.3
    it('property: pagination returns correct data slice and metadata', () => {
      fc.assert(
        fc.property(
          // Generate vehicle ID
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `GR86-${s}`),
          // Generate number of records
          fc.integer({ min: 10, max: 200 }),
          // Generate page and limit
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 10, max: 50 }),
          (vehicleId, totalRecords, page, limit) => {
            // Clear database (must clear telemetry first due to foreign key)
            db.exec('DELETE FROM telemetry');
            db.exec('DELETE FROM vehicles');

            // Insert telemetry records
            const records = [];
            for (let i = 0; i < totalRecords; i++) {
              records.push({
                vehicle_id: vehicleId,
                lap: 1,
                timestamp: new Date(Date.now() + i * 1000).toISOString(),
                telemetry_name: 'speed_can',
                telemetry_value: 100 + i
              });
            }
            insertTelemetry(records);

            // Calculate expected values
            const offset = (page - 1) * limit;
            const expectedLength = Math.min(limit, Math.max(0, totalRecords - offset));

            // Query with pagination
            const result = getTelemetryByVehicle(db, vehicleId, { limit, offset });

            // Property: Returned data should match expected slice
            const correctLength = result.data.length === expectedLength;
            const correctTotal = result.total === totalRecords;

            // Verify data is the correct slice
            let correctSlice = true;
            if (result.data.length > 0 && offset < totalRecords) {
              // First record should have value corresponding to offset
              const expectedFirstValue = 100 + offset;
              correctSlice = Math.abs(result.data[0].telemetry_value - expectedFirstValue) < 0.01;
            }

            return correctLength && correctTotal && correctSlice;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
