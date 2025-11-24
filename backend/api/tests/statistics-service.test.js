/**
 * Statistics Service Tests
 * Tests for statistics service business logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import {
  getOverviewStatistics,
  getVehicleStatistics,
  getLeaderboard
} from '../services/statistics-service.js';

describe('Statistics Service', () => {
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
        lap.timestamp || new Date().toISOString()
      );
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

  /**
   * Helper function to insert test telemetry
   */
  function insertTelemetry(telemetryRecords) {
    const stmt = db.prepare(`
      INSERT INTO telemetry (vehicle_id, lap, timestamp, telemetry_name, telemetry_value)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const record of telemetryRecords) {
      stmt.run(
        record.vehicle_id,
        record.lap,
        record.timestamp,
        record.telemetry_name,
        record.telemetry_value
      );
    }
  }

  describe('getOverviewStatistics', () => {
    it('should return overview statistics for the race', () => {
      const vehicles = [
        { vehicle_id: 'GR86-001', car_number: 1, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 180, position: 1 },
        { vehicle_id: 'GR86-002', car_number: 2, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 10, max_speed: 175, position: 2 }
      ];
      insertVehicles(vehicles);

      const laps = [
        { vehicle_id: 'GR86-001', lap: 1, lap_time: 150000 },
        { vehicle_id: 'GR86-001', lap: 2, lap_time: 151000 },
        { vehicle_id: 'GR86-002', lap: 1, lap_time: 155000 }
      ];
      insertLapTimes(laps);

      const telemetry = [
        { vehicle_id: 'GR86-001', lap: 1, timestamp: '2024-01-01T10:00:00Z', telemetry_name: 'speed', telemetry_value: 180 },
        { vehicle_id: 'GR86-001', lap: 1, timestamp: '2024-01-01T10:00:01Z', telemetry_name: 'speed', telemetry_value: 185 }
      ];
      insertTelemetry(telemetry);

      const result = getOverviewStatistics(db);
      
      expect(result.totalVehicles).toBe(2);
      expect(result.totalLaps).toBe(3);
      expect(result.totalTelemetryRecords).toBe(2);
      expect(result.fastestLap).toBe(150000);
      expect(result.maxSpeed).toBe(180);
      expect(result.classDist).toHaveLength(2);
    });

    it('should handle empty database', () => {
      const result = getOverviewStatistics(db);
      
      expect(result.totalVehicles).toBe(0);
      expect(result.totalLaps).toBe(0);
      expect(result.totalTelemetryRecords).toBe(0);
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

      const laps = [
        { vehicle_id: 'GR86-004-78', lap: 1, lap_time: 148630 },
        { vehicle_id: 'GR86-004-78', lap: 2, lap_time: 150000 },
        { vehicle_id: 'GR86-004-78', lap: 3, lap_time: 155000 }
      ];
      insertLapTimes(laps);

      const sections = [
        { vehicle_id: 'GR86-004-78', lap: 1, s1: 45000, s2: 50000, s3: 53630, lap_time: 148630, top_speed: 185.3 },
        { vehicle_id: 'GR86-004-78', lap: 2, s1: 46000, s2: 51000, s3: 53000, lap_time: 150000, top_speed: 183.0 }
      ];
      insertSectionTimes(sections);

      const result = getVehicleStatistics(db, 'GR86-004-78');
      
      expect(result).not.toBeNull();
      expect(result.vehicleId).toBe('GR86-004-78');
      expect(result.carNumber).toBe(78);
      expect(result.statistics.fastestLap).toBe(148630);
      expect(result.statistics.totalLaps).toBe(45);
      expect(result.statistics.sections).not.toBeNull();
      expect(result.statistics.sections.fastestS1).toBe(45000);
    });

    it('should return null for non-existent vehicle', () => {
      const result = getVehicleStatistics(db, 'NON-EXISTENT');
      expect(result).toBeNull();
    });

    it('should handle vehicle with no section data', () => {
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

      const laps = [
        { vehicle_id: 'GR86-001', lap: 1, lap_time: 150000 }
      ];
      insertLapTimes(laps);

      const result = getVehicleStatistics(db, 'GR86-001');
      
      expect(result).not.toBeNull();
      expect(result.statistics.sections).toBeNull();
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard sorted by fastest lap', () => {
      const vehicles = [
        { vehicle_id: 'GR86-001', car_number: 1, class: 'Pro', fastest_lap: 155000, average_lap: 157000, total_laps: 10, max_speed: 175, position: 3 },
        { vehicle_id: 'GR86-002', car_number: 2, class: 'Am', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 180, position: 1 },
        { vehicle_id: 'GR86-003', car_number: 3, class: 'Pro', fastest_lap: 152000, average_lap: 154000, total_laps: 10, max_speed: 178, position: 2 }
      ];
      insertVehicles(vehicles);

      const result = getLeaderboard(db, { sortBy: 'fastest_lap', order: 'asc' });
      
      expect(result).toHaveLength(3);
      expect(result[0].rank).toBe(1);
      expect(result[0].vehicleId).toBe('GR86-002');
      expect(result[0].fastestLap).toBe(150000);
      expect(result[1].rank).toBe(2);
      expect(result[1].fastestLap).toBe(152000);
      expect(result[2].rank).toBe(3);
      expect(result[2].fastestLap).toBe(155000);
    });

    it('should filter leaderboard by class', () => {
      const vehicles = [
        { vehicle_id: 'GR86-001', car_number: 1, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 180, position: 1 },
        { vehicle_id: 'GR86-002', car_number: 2, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 10, max_speed: 175, position: 2 },
        { vehicle_id: 'GR86-003', car_number: 3, class: 'Pro', fastest_lap: 152000, average_lap: 154000, total_laps: 10, max_speed: 178, position: 3 }
      ];
      insertVehicles(vehicles);

      const result = getLeaderboard(db, { class: 'Pro', sortBy: 'fastest_lap', order: 'asc' });
      
      expect(result).toHaveLength(2);
      expect(result.every(v => v.class === 'Pro')).toBe(true);
    });

    it('should respect limit parameter', () => {
      const vehicles = [
        { vehicle_id: 'GR86-001', car_number: 1, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 10, max_speed: 180, position: 1 },
        { vehicle_id: 'GR86-002', car_number: 2, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 10, max_speed: 175, position: 2 },
        { vehicle_id: 'GR86-003', car_number: 3, class: 'Pro', fastest_lap: 152000, average_lap: 154000, total_laps: 10, max_speed: 178, position: 3 }
      ];
      insertVehicles(vehicles);

      const result = getLeaderboard(db, { limit: 2 });
      
      expect(result).toHaveLength(2);
    });

    // Feature: racing-data-api, Property 20: Leaderboard ranking correctness
    // Validates: Requirements 13.3
    it('property: leaderboard vehicles are ranked in correct order by performance metric', () => {
      fc.assert(
        fc.property(
          // Generate array of vehicles with random performance metrics
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
            { minLength: 2, maxLength: 30 }
          ),
          fc.constantFrom('fastest_lap', 'average_lap', 'max_speed', 'total_laps'),
          fc.constantFrom('asc', 'desc'),
          (vehicles, sortBy, order) => {
            // Clear database and insert test vehicles
            db.exec('DELETE FROM vehicles');
            
            // Make vehicle IDs and car numbers unique
            const uniqueVehicles = vehicles.map((v, idx) => ({
              ...v,
              vehicle_id: `GR86-${idx}-${v.car_number}`,
              car_number: idx + 1
            }));
            
            insertVehicles(uniqueVehicles);

            // Get leaderboard
            const result = getLeaderboard(db, { sortBy, order, limit: 50 });

            // Property: Vehicles should be ranked in correct order
            if (result.length < 2) return true; // Trivially sorted
            
            for (let i = 0; i < result.length - 1; i++) {
              const current = result[i][sortBy === 'fastest_lap' ? 'fastestLap' : 
                                       sortBy === 'average_lap' ? 'averageLap' :
                                       sortBy === 'max_speed' ? 'maxSpeed' : 'totalLaps'];
              const next = result[i + 1][sortBy === 'fastest_lap' ? 'fastestLap' : 
                                         sortBy === 'average_lap' ? 'averageLap' :
                                         sortBy === 'max_speed' ? 'maxSpeed' : 'totalLaps'];
              
              if (order === 'asc') {
                if (current > next) return false;
              } else {
                if (current < next) return false;
              }
            }
            
            // Property: Ranks should be sequential starting from 1
            for (let i = 0; i < result.length; i++) {
              if (result[i].rank !== i + 1) return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Performance Tests', () => {
    // Feature: racing-data-api, Property 21: Statistics query performance
    // Validates: Requirements 13.5
    it('property: statistics queries complete in less than 50 milliseconds', () => {
      fc.assert(
        fc.property(
          // Generate array of vehicles
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
            { minLength: 10, maxLength: 50 }
          ),
          (vehicles) => {
            // Clear database and insert test vehicles (delete child tables first due to foreign keys)
            db.exec('DELETE FROM telemetry');
            db.exec('DELETE FROM lap_times');
            db.exec('DELETE FROM vehicles');
            
            // Make vehicle IDs and car numbers unique
            const uniqueVehicles = vehicles.map((v, idx) => ({
              ...v,
              vehicle_id: `GR86-${idx}-${v.car_number}`,
              car_number: idx + 1
            }));
            
            insertVehicles(uniqueVehicles);

            // Add some lap times for each vehicle (filter out vehicles with invalid fastest_lap)
            const laps = [];
            for (const vehicle of uniqueVehicles) {
              // Skip vehicles with NaN or invalid fastest_lap
              if (!isNaN(vehicle.fastest_lap) && isFinite(vehicle.fastest_lap)) {
                for (let i = 1; i <= 5; i++) {
                  laps.push({
                    vehicle_id: vehicle.vehicle_id,
                    lap: i,
                    lap_time: vehicle.fastest_lap + Math.random() * 5000
                  });
                }
              }
            }
            insertLapTimes(laps);

            // Add some telemetry records
            const telemetry = [];
            for (const vehicle of uniqueVehicles.slice(0, 5)) {
              for (let i = 0; i < 10; i++) {
                telemetry.push({
                  vehicle_id: vehicle.vehicle_id,
                  lap: 1,
                  timestamp: new Date(Date.now() + i * 1000).toISOString(),
                  telemetry_name: 'speed',
                  telemetry_value: 150 + Math.random() * 50
                });
              }
            }
            insertTelemetry(telemetry);

            // Test getOverviewStatistics performance
            const start1 = performance.now();
            getOverviewStatistics(db);
            const duration1 = performance.now() - start1;

            // Test getLeaderboard performance
            const start2 = performance.now();
            getLeaderboard(db, { sortBy: 'fastest_lap', order: 'asc' });
            const duration2 = performance.now() - start2;

            // Test getVehicleStatistics performance
            const start3 = performance.now();
            getVehicleStatistics(db, uniqueVehicles[0].vehicle_id);
            const duration3 = performance.now() - start3;

            // Property: All statistics queries should complete in < 50ms
            return duration1 < 50 && duration2 < 50 && duration3 < 50;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
