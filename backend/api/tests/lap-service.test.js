/**
 * Lap Service Tests
 * Tests for lap service business logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import {
  getLapsByVehicle,
  getFastestLaps,
  compareLaps,
  getLapStatistics
} from '../services/lap-service.js';

describe('Lap Service', () => {
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
  function insertLapTimes(laps) {
    const stmt = db.prepare(`
      INSERT INTO lap_times (vehicle_id, lap, lap_time, timestamp)
      VALUES (?, ?, ?, ?)
    `);

    for (const lap of laps) {
      stmt.run(
        lap.vehicle_id,
        lap.lap,
        lap.lap_time,
        lap.timestamp || null
      );
    }
  }

  describe('getLapsByVehicle', () => {
    it('should return all laps for a vehicle when no filter is applied', () => {
      const vehicle = {
        vehicle_id: 'GR86-001',
        car_number: 1,
        class: 'Pro',
        fastest_lap: 150000,
        average_lap: 152000,
        total_laps: 3,
        max_speed: 180,
        position: 1
      };
      insertVehicles([vehicle]);

      const laps = [
        { vehicle_id: 'GR86-001', lap: 1, lap_time: 152000 },
        { vehicle_id: 'GR86-001', lap: 2, lap_time: 150000 },
        { vehicle_id: 'GR86-001', lap: 3, lap_time: 151000 }
      ];
      insertLapTimes(laps);

      const result = getLapsByVehicle(db, 'GR86-001');
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    // Feature: racing-data-api, Property 6: Filter by categorical field
    // Validates: Requirements 6.1, 6.2
    it('property: lap range filtering returns only laps within range', () => {
      fc.assert(
        fc.property(
          // Generate a vehicle ID
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `GR86-${s}`),
          // Generate array of laps with random lap numbers
          fc.array(
            fc.record({
              lap: fc.integer({ min: 1, max: 100 }),
              lap_time: fc.float({ min: 140000, max: 160000 })
            }),
            { minLength: 5, maxLength: 50 }
          ),
          // Generate min and max lap range
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 51, max: 100 }),
          (vehicleId, laps, minLap, maxLap) => {
            // Clear database (delete lap_times first due to foreign key constraint)
            db.exec('DELETE FROM lap_times');
            db.exec('DELETE FROM vehicles');

            // Insert vehicle
            const vehicle = {
              vehicle_id: vehicleId,
              car_number: 1,
              class: 'Pro',
              fastest_lap: 150000,
              average_lap: 152000,
              total_laps: laps.length,
              max_speed: 180,
              position: 1
            };
            insertVehicles([vehicle]);

            // Insert laps with unique lap numbers (filter out NaN values)
            const uniqueLaps = laps
              .filter(lap => !isNaN(lap.lap_time) && isFinite(lap.lap_time))
              .map((lap, idx) => ({
                vehicle_id: vehicleId,
                lap: idx + 1,
                lap_time: lap.lap_time
              }));
            
            if (uniqueLaps.length === 0) return true; // Skip if no valid laps
            
            insertLapTimes(uniqueLaps);

            // Query with lap range filter
            const result = getLapsByVehicle(db, vehicleId, { minLap, maxLap });

            // Property: All returned laps should be within the specified range
            return result.data.every(lap => lap.lap >= minLap && lap.lap <= maxLap);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect pagination parameters', () => {
      const vehicle = {
        vehicle_id: 'GR86-001',
        car_number: 1,
        class: 'Pro',
        fastest_lap: 150000,
        average_lap: 152000,
        total_laps: 10,
        max_speed: 180,
        position: 1
      };
      insertVehicles([vehicle]);

      const laps = Array.from({ length: 10 }, (_, i) => ({
        vehicle_id: 'GR86-001',
        lap: i + 1,
        lap_time: 150000 + i * 1000
      }));
      insertLapTimes(laps);

      const result = getLapsByVehicle(db, 'GR86-001', { limit: 5, offset: 0 });
      expect(result.data).toHaveLength(5);
      expect(result.total).toBe(10);
      expect(result.data[0].lap).toBe(1);
    });
  });

  describe('getFastestLaps', () => {
    it('should return fastest laps sorted by time', () => {
      const vehicles = [
        { vehicle_id: 'GR86-001', car_number: 1, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 3, max_speed: 180, position: 1 },
        { vehicle_id: 'GR86-002', car_number: 2, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 3, max_speed: 175, position: 2 }
      ];
      insertVehicles(vehicles);

      const laps = [
        { vehicle_id: 'GR86-001', lap: 1, lap_time: 152000 },
        { vehicle_id: 'GR86-001', lap: 2, lap_time: 150000 },
        { vehicle_id: 'GR86-002', lap: 1, lap_time: 157000 },
        { vehicle_id: 'GR86-002', lap: 2, lap_time: 155000 }
      ];
      insertLapTimes(laps);

      const result = getFastestLaps(db, { limit: 3 });
      expect(result).toHaveLength(3);
      expect(result[0].lap_time).toBe(150000);
      expect(result[1].lap_time).toBe(152000);
      expect(result[2].lap_time).toBe(155000);
    });

    // Feature: racing-data-api, Property 7: Sort order correctness
    // Validates: Requirements 6.3
    it('property: fastest laps are sorted in ascending order by lap time', () => {
      fc.assert(
        fc.property(
          // Generate array of vehicles
          fc.array(
            fc.record({
              vehicle_id: fc.string({ minLength: 5, maxLength: 20 }).map(s => `GR86-${s}`),
              car_number: fc.integer({ min: 1, max: 999 }),
              class: fc.constantFrom('Pro', 'Am', 'ProAm')
            }),
            { minLength: 1, maxLength: 10 }
          ),
          // Generate laps for each vehicle
          fc.integer({ min: 1, max: 10 }),
          (vehicles, lapsPerVehicle) => {
            // Clear database (delete lap_times first due to foreign key constraint)
            db.exec('DELETE FROM lap_times');
            db.exec('DELETE FROM vehicles');

            // Make vehicle IDs and car numbers unique
            const uniqueVehicles = vehicles.map((v, idx) => ({
              ...v,
              vehicle_id: `GR86-${idx}`,
              car_number: idx + 1,
              fastest_lap: 150000,
              average_lap: 152000,
              total_laps: lapsPerVehicle,
              max_speed: 180,
              position: idx + 1
            }));
            insertVehicles(uniqueVehicles);

            // Insert random lap times for each vehicle
            const allLaps = [];
            for (const vehicle of uniqueVehicles) {
              for (let i = 0; i < lapsPerVehicle; i++) {
                allLaps.push({
                  vehicle_id: vehicle.vehicle_id,
                  lap: i + 1,
                  lap_time: 140000 + Math.random() * 20000
                });
              }
            }
            insertLapTimes(allLaps);

            // Query fastest laps
            const limit = Math.min(20, allLaps.length);
            const result = getFastestLaps(db, { limit });

            // Property: Results should be sorted in ascending order by lap_time
            if (result.length < 2) return true;

            for (let i = 0; i < result.length - 1; i++) {
              if (result[i].lap_time > result[i + 1].lap_time) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter by vehicle class', () => {
      const vehicles = [
        { vehicle_id: 'GR86-001', car_number: 1, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 2, max_speed: 180, position: 1 },
        { vehicle_id: 'GR86-002', car_number: 2, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 2, max_speed: 175, position: 2 }
      ];
      insertVehicles(vehicles);

      const laps = [
        { vehicle_id: 'GR86-001', lap: 1, lap_time: 150000 },
        { vehicle_id: 'GR86-002', lap: 1, lap_time: 155000 }
      ];
      insertLapTimes(laps);

      const result = getFastestLaps(db, { class: 'Pro', limit: 10 });
      expect(result.every(lap => lap.class === 'Pro')).toBe(true);
    });
  });

  describe('compareLaps', () => {
    it('should return laps for all specified vehicles', () => {
      const vehicles = [
        { vehicle_id: 'GR86-001', car_number: 1, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 2, max_speed: 180, position: 1 },
        { vehicle_id: 'GR86-002', car_number: 2, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 2, max_speed: 175, position: 2 }
      ];
      insertVehicles(vehicles);

      const laps = [
        { vehicle_id: 'GR86-001', lap: 1, lap_time: 152000 },
        { vehicle_id: 'GR86-001', lap: 2, lap_time: 150000 },
        { vehicle_id: 'GR86-002', lap: 1, lap_time: 157000 },
        { vehicle_id: 'GR86-002', lap: 2, lap_time: 155000 }
      ];
      insertLapTimes(laps);

      const result = compareLaps(db, ['GR86-001', 'GR86-002']);
      expect(result['GR86-001']).toHaveLength(2);
      expect(result['GR86-002']).toHaveLength(2);
    });

    // Feature: racing-data-api, Property 9: Multi-vehicle query completeness
    // Validates: Requirements 6.5
    it('property: comparison returns data for all requested vehicles that exist', () => {
      fc.assert(
        fc.property(
          // Generate array of vehicles
          fc.array(
            fc.record({
              vehicle_id: fc.string({ minLength: 5, maxLength: 20 }).map(s => `GR86-${s}`),
              car_number: fc.integer({ min: 1, max: 999 }),
              class: fc.constantFrom('Pro', 'Am', 'ProAm')
            }),
            { minLength: 1, maxLength: 10 }
          ),
          // Generate laps per vehicle
          fc.integer({ min: 1, max: 10 }),
          (vehicles, lapsPerVehicle) => {
            // Clear database (delete lap_times first due to foreign key constraint)
            db.exec('DELETE FROM lap_times');
            db.exec('DELETE FROM vehicles');

            // Make vehicle IDs and car numbers unique
            const uniqueVehicles = vehicles.map((v, idx) => ({
              ...v,
              vehicle_id: `GR86-${idx}`,
              car_number: idx + 1,
              fastest_lap: 150000,
              average_lap: 152000,
              total_laps: lapsPerVehicle,
              max_speed: 180,
              position: idx + 1
            }));
            insertVehicles(uniqueVehicles);

            // Insert laps for each vehicle
            const allLaps = [];
            for (const vehicle of uniqueVehicles) {
              for (let i = 0; i < lapsPerVehicle; i++) {
                allLaps.push({
                  vehicle_id: vehicle.vehicle_id,
                  lap: i + 1,
                  lap_time: 140000 + Math.random() * 20000
                });
              }
            }
            insertLapTimes(allLaps);

            // Query comparison for all vehicles
            const vehicleIds = uniqueVehicles.map(v => v.vehicle_id);
            const result = compareLaps(db, vehicleIds);

            // Property: Result should contain data for all requested vehicles
            return vehicleIds.every(vehicleId => {
              return vehicleId in result && Array.isArray(result[vehicleId]);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty object for empty vehicle list', () => {
      const result = compareLaps(db, []);
      expect(result).toEqual({});
    });

    it('should respect lap range filters', () => {
      const vehicle = {
        vehicle_id: 'GR86-001',
        car_number: 1,
        class: 'Pro',
        fastest_lap: 150000,
        average_lap: 152000,
        total_laps: 5,
        max_speed: 180,
        position: 1
      };
      insertVehicles([vehicle]);

      const laps = Array.from({ length: 5 }, (_, i) => ({
        vehicle_id: 'GR86-001',
        lap: i + 1,
        lap_time: 150000 + i * 1000
      }));
      insertLapTimes(laps);

      const result = compareLaps(db, ['GR86-001'], { minLap: 2, maxLap: 4 });
      expect(result['GR86-001']).toHaveLength(3);
      expect(result['GR86-001'].every(lap => lap.lap >= 2 && lap.lap <= 4)).toBe(true);
    });
  });

  describe('getLapStatistics', () => {
    it('should calculate statistics correctly', () => {
      const vehicle = {
        vehicle_id: 'GR86-001',
        car_number: 1,
        class: 'Pro',
        fastest_lap: 150000,
        average_lap: 152000,
        total_laps: 3,
        max_speed: 180,
        position: 1
      };
      insertVehicles([vehicle]);

      const laps = [
        { vehicle_id: 'GR86-001', lap: 1, lap_time: 150000 },
        { vehicle_id: 'GR86-001', lap: 2, lap_time: 152000 },
        { vehicle_id: 'GR86-001', lap: 3, lap_time: 154000 }
      ];
      insertLapTimes(laps);

      const result = getLapStatistics(db, 'GR86-001');
      expect(result).not.toBeNull();
      expect(result.count).toBe(3);
      expect(result.fastest).toBe(150000);
      expect(result.slowest).toBe(154000);
      expect(result.average).toBe(152000);
    });

    // Feature: racing-data-api, Property 10: Statistics calculation accuracy
    // Validates: Requirements 6.4
    it('property: statistics match mathematical definitions', () => {
      fc.assert(
        fc.property(
          // Generate a vehicle ID
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `GR86-${s}`),
          // Generate array of lap times
          fc.array(
            fc.float({ min: 140000, max: 160000 }),
            { minLength: 2, maxLength: 50 }
          ),
          (vehicleId, lapTimes) => {
            // Clear database (delete lap_times first due to foreign key constraint)
            db.exec('DELETE FROM lap_times');
            db.exec('DELETE FROM vehicles');

            // Insert vehicle
            const vehicle = {
              vehicle_id: vehicleId,
              car_number: 1,
              class: 'Pro',
              fastest_lap: Math.min(...lapTimes),
              average_lap: lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length,
              total_laps: lapTimes.length,
              max_speed: 180,
              position: 1
            };
            insertVehicles([vehicle]);

            // Filter out NaN and infinite values, then insert laps
            const validLapTimes = lapTimes.filter(time => !isNaN(time) && isFinite(time));
            
            if (validLapTimes.length < 2) return true; // Skip if not enough valid laps
            
            const laps = validLapTimes.map((time, idx) => ({
              vehicle_id: vehicleId,
              lap: idx + 1,
              lap_time: time
            }));
            insertLapTimes(laps);

            // Get statistics
            const result = getLapStatistics(db, vehicleId);

            if (!result) return false;

            // Calculate expected values using validLapTimes
            const expectedFastest = Math.min(...validLapTimes);
            const expectedSlowest = Math.max(...validLapTimes);
            const expectedAverage = validLapTimes.reduce((a, b) => a + b, 0) / validLapTimes.length;
            
            // Calculate expected standard deviation
            const variance = validLapTimes.reduce((sum, time) => {
              return sum + Math.pow(time - expectedAverage, 2);
            }, 0) / validLapTimes.length;
            const expectedStdDev = Math.sqrt(variance);

            // Property: Statistics should match mathematical definitions (with floating point tolerance)
            const tolerance = 0.01;
            return (
              result.count === validLapTimes.length &&
              Math.abs(result.fastest - expectedFastest) < tolerance &&
              Math.abs(result.slowest - expectedSlowest) < tolerance &&
              Math.abs(result.average - expectedAverage) < tolerance &&
              Math.abs(result.standardDeviation - expectedStdDev) < tolerance
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for vehicle with no laps', () => {
      const vehicle = {
        vehicle_id: 'GR86-001',
        car_number: 1,
        class: 'Pro',
        fastest_lap: 150000,
        average_lap: 152000,
        total_laps: 0,
        max_speed: 180,
        position: 1
      };
      insertVehicles([vehicle]);

      const result = getLapStatistics(db, 'GR86-001');
      expect(result).toBeNull();
    });

    it('should respect lap range filters in statistics', () => {
      const vehicle = {
        vehicle_id: 'GR86-001',
        car_number: 1,
        class: 'Pro',
        fastest_lap: 150000,
        average_lap: 152000,
        total_laps: 5,
        max_speed: 180,
        position: 1
      };
      insertVehicles([vehicle]);

      const laps = [
        { vehicle_id: 'GR86-001', lap: 1, lap_time: 160000 },
        { vehicle_id: 'GR86-001', lap: 2, lap_time: 150000 },
        { vehicle_id: 'GR86-001', lap: 3, lap_time: 152000 },
        { vehicle_id: 'GR86-001', lap: 4, lap_time: 151000 },
        { vehicle_id: 'GR86-001', lap: 5, lap_time: 155000 }
      ];
      insertLapTimes(laps);

      const result = getLapStatistics(db, 'GR86-001', { minLap: 2, maxLap: 4 });
      expect(result.count).toBe(3);
      expect(result.fastest).toBe(150000);
      expect(result.slowest).toBe(152000);
    });
  });
});
