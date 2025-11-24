/**
 * Section Service Tests
 * Tests for section service business logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import {
  getSectionsByVehicle,
  getFastestSectionTimes,
  compareSections,
  getSectionLeaders
} from '../services/section-service.js';

describe('Section Service', () => {
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
        section.s1 || null,
        section.s2 || null,
        section.s3 || null,
        section.lap_time || null,
        section.top_speed || null
      );
    }
  }

  describe('getSectionsByVehicle', () => {
    it('should return all sections for a vehicle when no filter is applied', () => {
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

      const sections = [
        { vehicle_id: 'GR86-001', lap: 1, s1: 45000, s2: 50000, s3: 55000, lap_time: 150000 },
        { vehicle_id: 'GR86-001', lap: 2, s1: 44000, s2: 49000, s3: 54000, lap_time: 147000 },
        { vehicle_id: 'GR86-001', lap: 3, s1: 45500, s2: 50500, s3: 55500, lap_time: 151500 }
      ];
      insertSectionTimes(sections);

      const result = getSectionsByVehicle(db, 'GR86-001');
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    // Feature: racing-data-api, Property 6: Filter by categorical field
    // Validates: Requirements 7.1, 7.5
    it('property: section filtering returns only sections matching filter criteria', () => {
      fc.assert(
        fc.property(
          // Generate a vehicle ID
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `GR86-${s}`),
          // Generate array of sections with random lap numbers
          fc.array(
            fc.record({
              lap: fc.integer({ min: 1, max: 100 }),
              s1: fc.float({ min: 40000, max: 50000 }),
              s2: fc.float({ min: 45000, max: 55000 }),
              s3: fc.float({ min: 50000, max: 60000 })
            }),
            { minLength: 5, maxLength: 50 }
          ),
          // Generate specific lap to filter by
          fc.integer({ min: 1, max: 100 }),
          (vehicleId, sections, filterLap) => {
            // Clear database (delete section_times first due to foreign key constraint)
            db.exec('DELETE FROM section_times');
            db.exec('DELETE FROM vehicles');

            // Insert vehicle
            const vehicle = {
              vehicle_id: vehicleId,
              car_number: 1,
              class: 'Pro',
              fastest_lap: 150000,
              average_lap: 152000,
              total_laps: sections.length,
              max_speed: 180,
              position: 1
            };
            insertVehicles([vehicle]);

            // Insert sections with unique lap numbers (filter out NaN values)
            const uniqueSections = sections
              .filter(s => !isNaN(s.s1) && isFinite(s.s1) && !isNaN(s.s2) && isFinite(s.s2) && !isNaN(s.s3) && isFinite(s.s3))
              .map((section, idx) => ({
                vehicle_id: vehicleId,
                lap: idx + 1,
                s1: section.s1,
                s2: section.s2,
                s3: section.s3,
                lap_time: section.s1 + section.s2 + section.s3
              }));
            
            if (uniqueSections.length === 0) return true; // Skip if no valid sections
            
            insertSectionTimes(uniqueSections);

            // Query with lap filter
            const result = getSectionsByVehicle(db, vehicleId, { lap: filterLap });

            // Property: All returned sections should match the filter criteria (specific lap)
            return result.data.every(section => section.lap === filterLap);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter by specific lap number', () => {
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

      const sections = [
        { vehicle_id: 'GR86-001', lap: 1, s1: 45000, s2: 50000, s3: 55000 },
        { vehicle_id: 'GR86-001', lap: 2, s1: 44000, s2: 49000, s3: 54000 },
        { vehicle_id: 'GR86-001', lap: 3, s1: 45500, s2: 50500, s3: 55500 }
      ];
      insertSectionTimes(sections);

      const result = getSectionsByVehicle(db, 'GR86-001', { lap: 2 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].lap).toBe(2);
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

      const sections = Array.from({ length: 10 }, (_, i) => ({
        vehicle_id: 'GR86-001',
        lap: i + 1,
        s1: 45000 + i * 100,
        s2: 50000 + i * 100,
        s3: 55000 + i * 100
      }));
      insertSectionTimes(sections);

      const result = getSectionsByVehicle(db, 'GR86-001', { limit: 5, offset: 0 });
      expect(result.data).toHaveLength(5);
      expect(result.total).toBe(10);
      expect(result.data[0].lap).toBe(1);
    });
  });

  describe('getFastestSectionTimes', () => {
    it('should return fastest section times sorted by time', () => {
      const vehicles = [
        { vehicle_id: 'GR86-001', car_number: 1, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 2, max_speed: 180, position: 1 },
        { vehicle_id: 'GR86-002', car_number: 2, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 2, max_speed: 175, position: 2 }
      ];
      insertVehicles(vehicles);

      const sections = [
        { vehicle_id: 'GR86-001', lap: 1, s1: 45000, s2: 50000, s3: 55000 },
        { vehicle_id: 'GR86-001', lap: 2, s1: 44000, s2: 49000, s3: 54000 },
        { vehicle_id: 'GR86-002', lap: 1, s1: 46000, s2: 51000, s3: 56000 },
        { vehicle_id: 'GR86-002', lap: 2, s1: 45500, s2: 50500, s3: 55500 }
      ];
      insertSectionTimes(sections);

      const result = getFastestSectionTimes(db, { section: 's1', limit: 3 });
      expect(result).toHaveLength(3);
      expect(result[0].s1).toBe(44000);
      expect(result[1].s1).toBe(45000);
      expect(result[2].s1).toBe(45500);
    });

    // Feature: racing-data-api, Property 11: Minimum value identification per group
    // Validates: Requirements 7.2, 7.4
    it('property: fastest section identification returns actual minimum per group', () => {
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
          // Generate sections per vehicle
          fc.integer({ min: 1, max: 10 }),
          // Generate section to query
          fc.constantFrom('s1', 's2', 's3'),
          (vehicles, sectionsPerVehicle, sectionField) => {
            // Clear database (delete section_times first due to foreign key constraint)
            db.exec('DELETE FROM section_times');
            db.exec('DELETE FROM vehicles');

            // Make vehicle IDs and car numbers unique
            const uniqueVehicles = vehicles.map((v, idx) => ({
              ...v,
              vehicle_id: `GR86-${idx}`,
              car_number: idx + 1,
              fastest_lap: 150000,
              average_lap: 152000,
              total_laps: sectionsPerVehicle,
              max_speed: 180,
              position: idx + 1
            }));
            insertVehicles(uniqueVehicles);

            // Insert random section times for each vehicle
            const allSections = [];
            for (const vehicle of uniqueVehicles) {
              for (let i = 0; i < sectionsPerVehicle; i++) {
                allSections.push({
                  vehicle_id: vehicle.vehicle_id,
                  lap: i + 1,
                  s1: 40000 + Math.random() * 10000,
                  s2: 45000 + Math.random() * 10000,
                  s3: 50000 + Math.random() * 10000
                });
              }
            }
            insertSectionTimes(allSections);

            // Query fastest section times
            const limit = Math.min(20, allSections.length);
            const result = getFastestSectionTimes(db, { section: sectionField, limit });

            if (result.length === 0) return true;

            // Property: The first result should have the minimum value for the queried section
            const allSectionValues = allSections.map(s => s[sectionField]);
            const actualMinimum = Math.min(...allSectionValues);
            
            // Allow small floating point tolerance
            const tolerance = 0.01;
            return Math.abs(result[0][sectionField] - actualMinimum) < tolerance;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter by vehicle class', () => {
      const vehicles = [
        { vehicle_id: 'GR86-001', car_number: 1, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 1, max_speed: 180, position: 1 },
        { vehicle_id: 'GR86-002', car_number: 2, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 1, max_speed: 175, position: 2 }
      ];
      insertVehicles(vehicles);

      const sections = [
        { vehicle_id: 'GR86-001', lap: 1, s1: 45000, s2: 50000, s3: 55000 },
        { vehicle_id: 'GR86-002', lap: 1, s1: 46000, s2: 51000, s3: 56000 }
      ];
      insertSectionTimes(sections);

      const result = getFastestSectionTimes(db, { section: 's1', class: 'Pro', limit: 10 });
      expect(result.every(section => section.class === 'Pro')).toBe(true);
    });
  });

  describe('compareSections', () => {
    it('should return sections for all specified vehicles', () => {
      const vehicles = [
        { vehicle_id: 'GR86-001', car_number: 1, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 2, max_speed: 180, position: 1 },
        { vehicle_id: 'GR86-002', car_number: 2, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 2, max_speed: 175, position: 2 }
      ];
      insertVehicles(vehicles);

      const sections = [
        { vehicle_id: 'GR86-001', lap: 1, s1: 45000, s2: 50000, s3: 55000 },
        { vehicle_id: 'GR86-001', lap: 2, s1: 44000, s2: 49000, s3: 54000 },
        { vehicle_id: 'GR86-002', lap: 1, s1: 46000, s2: 51000, s3: 56000 },
        { vehicle_id: 'GR86-002', lap: 2, s1: 45500, s2: 50500, s3: 55500 }
      ];
      insertSectionTimes(sections);

      const result = compareSections(db, ['GR86-001', 'GR86-002']);
      expect(result['GR86-001']).toHaveLength(2);
      expect(result['GR86-002']).toHaveLength(2);
    });

    // Feature: racing-data-api, Property 9: Multi-vehicle query completeness
    // Validates: Requirements 7.3
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
          // Generate sections per vehicle
          fc.integer({ min: 1, max: 10 }),
          (vehicles, sectionsPerVehicle) => {
            // Clear database (delete section_times first due to foreign key constraint)
            db.exec('DELETE FROM section_times');
            db.exec('DELETE FROM vehicles');

            // Make vehicle IDs and car numbers unique
            const uniqueVehicles = vehicles.map((v, idx) => ({
              ...v,
              vehicle_id: `GR86-${idx}`,
              car_number: idx + 1,
              fastest_lap: 150000,
              average_lap: 152000,
              total_laps: sectionsPerVehicle,
              max_speed: 180,
              position: idx + 1
            }));
            insertVehicles(uniqueVehicles);

            // Insert sections for each vehicle
            const allSections = [];
            for (const vehicle of uniqueVehicles) {
              for (let i = 0; i < sectionsPerVehicle; i++) {
                allSections.push({
                  vehicle_id: vehicle.vehicle_id,
                  lap: i + 1,
                  s1: 40000 + Math.random() * 10000,
                  s2: 45000 + Math.random() * 10000,
                  s3: 50000 + Math.random() * 10000
                });
              }
            }
            insertSectionTimes(allSections);

            // Query comparison for all vehicles
            const vehicleIds = uniqueVehicles.map(v => v.vehicle_id);
            const result = compareSections(db, vehicleIds);

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
      const result = compareSections(db, []);
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

      const sections = Array.from({ length: 5 }, (_, i) => ({
        vehicle_id: 'GR86-001',
        lap: i + 1,
        s1: 45000 + i * 100,
        s2: 50000 + i * 100,
        s3: 55000 + i * 100
      }));
      insertSectionTimes(sections);

      const result = compareSections(db, ['GR86-001'], { minLap: 2, maxLap: 4 });
      expect(result['GR86-001']).toHaveLength(3);
      expect(result['GR86-001'].every(section => section.lap >= 2 && section.lap <= 4)).toBe(true);
    });
  });

  describe('getSectionLeaders', () => {
    it('should return fastest vehicle for each section', () => {
      const vehicles = [
        { vehicle_id: 'GR86-001', car_number: 1, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 2, max_speed: 180, position: 1 },
        { vehicle_id: 'GR86-002', car_number: 2, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 2, max_speed: 175, position: 2 }
      ];
      insertVehicles(vehicles);

      const sections = [
        { vehicle_id: 'GR86-001', lap: 1, s1: 45000, s2: 51000, s3: 55000 },
        { vehicle_id: 'GR86-002', lap: 1, s1: 46000, s2: 50000, s3: 54000 }
      ];
      insertSectionTimes(sections);

      const result = getSectionLeaders(db);
      expect(result.s1).toBeDefined();
      expect(result.s2).toBeDefined();
      expect(result.s3).toBeDefined();
      expect(result.s1.vehicle_id).toBe('GR86-001'); // Fastest S1
      expect(result.s2.vehicle_id).toBe('GR86-002'); // Fastest S2
      expect(result.s3.vehicle_id).toBe('GR86-002'); // Fastest S3
    });

    it('should filter by vehicle class', () => {
      const vehicles = [
        { vehicle_id: 'GR86-001', car_number: 1, class: 'Pro', fastest_lap: 150000, average_lap: 152000, total_laps: 1, max_speed: 180, position: 1 },
        { vehicle_id: 'GR86-002', car_number: 2, class: 'Am', fastest_lap: 155000, average_lap: 157000, total_laps: 1, max_speed: 175, position: 2 }
      ];
      insertVehicles(vehicles);

      const sections = [
        { vehicle_id: 'GR86-001', lap: 1, s1: 45000, s2: 50000, s3: 55000 },
        { vehicle_id: 'GR86-002', lap: 1, s1: 44000, s2: 49000, s3: 54000 }
      ];
      insertSectionTimes(sections);

      const result = getSectionLeaders(db, { class: 'Pro' });
      expect(result.s1.vehicle_id).toBe('GR86-001');
      expect(result.s1.class).toBe('Pro');
    });

    it('should filter by specific lap', () => {
      const vehicle = {
        vehicle_id: 'GR86-001',
        car_number: 1,
        class: 'Pro',
        fastest_lap: 150000,
        average_lap: 152000,
        total_laps: 2,
        max_speed: 180,
        position: 1
      };
      insertVehicles([vehicle]);

      const sections = [
        { vehicle_id: 'GR86-001', lap: 1, s1: 45000, s2: 50000, s3: 55000 },
        { vehicle_id: 'GR86-001', lap: 2, s1: 44000, s2: 49000, s3: 54000 }
      ];
      insertSectionTimes(sections);

      const result = getSectionLeaders(db, { lap: 2 });
      expect(result.s1.lap).toBe(2);
      expect(result.s1.s1).toBe(44000);
    });
  });
});
