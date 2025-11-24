/**
 * Vehicle Service Tests
 * Tests for vehicle service business logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import {
  getAllVehicles,
  getVehicleById,
  getVehicleByCarNumber,
  getVehicleStatistics
} from '../services/vehicle-service.js';

describe('Vehicle Service', () => {
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

  describe('getAllVehicles', () => {
    it('should return all vehicles when no filter is applied', () => {
      const vehicles = [
        { vehicle_id: 'GR86-001', car_number: 1, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 180, position: 1 },
        { vehicle_id: 'GR86-002', car_number: 2, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 10, max_speed: 175, position: 2 }
      ];
      insertVehicles(vehicles);

      const result = getAllVehicles(db);
      expect(result).toHaveLength(2);
    });

    // Feature: racing-data-api, Property 6: Filter by categorical field
    // Validates: Requirements 5.1
    it('property: filtering by class returns only vehicles of that class', () => {
      fc.assert(
        fc.property(
          // Generate array of vehicles with random classes
          fc.array(
            fc.record({
              vehicle_id: fc.string({ minLength: 5, maxLength: 20 }).map(s => `GR86-${s}`),
              car_number: fc.integer({ min: 1, max: 999 }),
              class: fc.constantFrom('Pro', 'Am', 'ProAm'),
              fastest_lap: fc.float({ min: 140000, max: 160000 }),
              average_lap: fc.float({ min: 145000, max: 165000 }),
              total_laps: fc.integer({ min: 1, max: 50 }),
              max_speed: fc.float({ min: 150, max: 200 }),
              position: fc.integer({ min: 1, max: 50 })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          fc.constantFrom('Pro', 'Am', 'ProAm'),
          (vehicles, filterClass) => {
            // Clear database and insert test vehicles
            db.exec('DELETE FROM vehicles');
            
            // Make vehicle IDs and car numbers unique
            const uniqueVehicles = vehicles.map((v, idx) => ({
              ...v,
              vehicle_id: `GR86-${idx}-${v.car_number}`,
              car_number: idx + 1
            }));
            
            insertVehicles(uniqueVehicles);

            // Query with class filter
            const result = getAllVehicles(db, { class: filterClass });

            // Property: All returned vehicles should match the filter class
            return result.every(vehicle => vehicle.class === filterClass);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: racing-data-api, Property 7: Sort order correctness
    // Validates: Requirements 5.2
    it('property: sorting by fastest lap returns correctly ordered vehicles', () => {
      fc.assert(
        fc.property(
          // Generate array of vehicles with random lap times
          fc.array(
            fc.record({
              vehicle_id: fc.string({ minLength: 5, maxLength: 20 }).map(s => `GR86-${s}`),
              car_number: fc.integer({ min: 1, max: 999 }),
              class: fc.constantFrom('Pro', 'Am', 'ProAm'),
              fastest_lap: fc.float({ min: 140000, max: 160000 }),
              average_lap: fc.float({ min: 145000, max: 165000 }),
              total_laps: fc.integer({ min: 1, max: 50 }),
              max_speed: fc.float({ min: 150, max: 200 }),
              position: fc.integer({ min: 1, max: 50 })
            }),
            { minLength: 2, maxLength: 20 }
          ),
          fc.constantFrom('asc', 'desc'),
          (vehicles, order) => {
            // Clear database and insert test vehicles
            db.exec('DELETE FROM vehicles');
            
            // Make vehicle IDs and car numbers unique
            const uniqueVehicles = vehicles.map((v, idx) => ({
              ...v,
              vehicle_id: `GR86-${idx}-${v.car_number}`,
              car_number: idx + 1
            }));
            
            insertVehicles(uniqueVehicles);

            // Query with sorting by fastest_lap
            const result = getAllVehicles(db, { sortBy: 'fastest_lap', order });

            // Property: Results should be sorted correctly
            if (result.length < 2) return true; // Trivially sorted
            
            for (let i = 0; i < result.length - 1; i++) {
              const current = result[i].fastest_lap;
              const next = result[i + 1].fastest_lap;
              
              if (order === 'asc') {
                if (current > next) return false;
              } else {
                if (current < next) return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getVehicleById', () => {
    it('should return vehicle when ID exists', () => {
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

      const result = getVehicleById(db, 'GR86-004-78');
      expect(result).not.toBeNull();
      expect(result.vehicle_id).toBe('GR86-004-78');
      expect(result.car_number).toBe(78);
    });

    it('should return null when ID does not exist', () => {
      const result = getVehicleById(db, 'NON-EXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('getVehicleByCarNumber', () => {
    it('should return vehicle when car number exists', () => {
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

      const result = getVehicleByCarNumber(db, 78);
      expect(result).not.toBeNull();
      expect(result.vehicle_id).toBe('GR86-004-78');
      expect(result.car_number).toBe(78);
    });

    it('should return null when car number does not exist', () => {
      const result = getVehicleByCarNumber(db, 999);
      expect(result).toBeNull();
    });

    // Feature: racing-data-api, Property 8: Car number to vehicle ID resolution
    // Validates: Requirements 5.4
    it('property: car number resolution returns correct vehicle ID', () => {
      fc.assert(
        fc.property(
          // Generate array of vehicles with unique car numbers
          fc.array(
            fc.record({
              vehicle_id: fc.string({ minLength: 5, maxLength: 20 }).map(s => `GR86-${s}`),
              car_number: fc.integer({ min: 1, max: 999 }),
              class: fc.constantFrom('Pro', 'Am', 'ProAm'),
              fastest_lap: fc.float({ min: 140000, max: 160000 }),
              average_lap: fc.float({ min: 145000, max: 165000 }),
              total_laps: fc.integer({ min: 1, max: 50 }),
              max_speed: fc.float({ min: 150, max: 200 }),
              position: fc.integer({ min: 1, max: 50 })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (vehicles) => {
            // Clear database and insert test vehicles
            db.exec('DELETE FROM vehicles');
            
            // Make vehicle IDs and car numbers unique
            const uniqueVehicles = vehicles.map((v, idx) => ({
              ...v,
              vehicle_id: `GR86-${idx}-${v.car_number}`,
              car_number: idx + 1
            }));
            
            insertVehicles(uniqueVehicles);

            // Property: For each vehicle, resolving by car number should return the correct vehicle ID
            return uniqueVehicles.every(vehicle => {
              const result = getVehicleByCarNumber(db, vehicle.car_number);
              return result !== null && result.vehicle_id === vehicle.vehicle_id;
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getVehicleStatistics', () => {
    it('should return statistics for existing vehicle', () => {
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

      const result = getVehicleStatistics(db, 'GR86-004-78');
      expect(result).not.toBeNull();
      expect(result.vehicleId).toBe('GR86-004-78');
      expect(result.statistics.fastestLap).toBe(148630);
      expect(result.statistics.totalLaps).toBe(45);
    });

    it('should return null for non-existent vehicle', () => {
      const result = getVehicleStatistics(db, 'NON-EXISTENT');
      expect(result).toBeNull();
    });
  });
});
