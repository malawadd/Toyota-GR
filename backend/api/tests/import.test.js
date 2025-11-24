/**
 * Tests for data import module
 * Includes property-based tests for import correctness
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import {
  importVehicles,
  importLapTimes,
  importTelemetry,
  importResults,
  importSections,
  importWeather
} from '../database/import.js';

describe('Data Import Module', () => {
  let db;

  beforeEach(() => {
    // Create in-memory database for testing
    db = initializeDatabase(':memory:', { memory: true });
  });

  afterEach(() => {
    if (db) {
      closeDatabase(db);
    }
  });

  // Helper function to clear all data from database
  function clearDatabase(db) {
    db.exec('DELETE FROM lap_times');
    db.exec('DELETE FROM telemetry');
    db.exec('DELETE FROM race_results');
    db.exec('DELETE FROM section_times');
    db.exec('DELETE FROM weather');
    db.exec('DELETE FROM vehicles');
  }

  /**
   * Feature: racing-data-api, Property 1: Import record count preservation
   * For any set of CSV records imported into the database, 
   * the count of records in the database should equal the count of records parsed from the CSV
   * Validates: Requirements 2.3
   */
  describe('Property 1: Import record count preservation', () => {
    it('should preserve lap time record count after import', () => {
      fc.assert(
        fc.property(
          // Generate array of lap time records
          fc.array(
            fc.record({
              vehicle_id: fc.constantFrom('GR86-004-78', 'GR86-004-46', 'GR86-004-12'),
              lap: fc.integer({ min: 1, max: 50 }),
              value: fc.integer({ min: 140000, max: 180000 }), // milliseconds
              timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
            }),
            { minLength: 1, maxLength: 100 }
          ),
          (lapData) => {
            // Clear database before each test run
            clearDatabase(db);

            // First, insert vehicles to satisfy foreign key constraints
            const vehicleIds = [...new Set(lapData.map(lap => lap.vehicle_id))];
            const insertVehicle = db.prepare('INSERT OR IGNORE INTO vehicles (vehicle_id, car_number) VALUES (?, ?)');
            for (const vehicleId of vehicleIds) {
              const carNumber = parseInt(vehicleId.split('-').pop(), 10);
              insertVehicle.run(vehicleId, carNumber);
            }

            // Import lap times
            const imported = importLapTimes(db, lapData);

            // Query database to count records
            const count = db.prepare('SELECT COUNT(*) as count FROM lap_times').get();

            // Property: imported count should equal database count
            return imported === lapData.length && count.count === lapData.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve telemetry record count after import', () => {
      fc.assert(
        fc.property(
          // Generate array of telemetry records
          fc.array(
            fc.record({
              vehicle_id: fc.constantFrom('GR86-004-78', 'GR86-004-46', 'GR86-004-12'),
              lap: fc.integer({ min: 1, max: 50 }),
              timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              telemetry_name: fc.constantFrom('vCar', 'speed_can', 'brake_front', 'throttle'),
              telemetry_value: fc.float({ min: 0, max: 200, noNaN: true })
            }),
            { minLength: 1, maxLength: 100 }
          ),
          (telemetryData) => {
            // Clear database before each test run
            clearDatabase(db);

            // First, insert vehicles to satisfy foreign key constraints
            const vehicleIds = [...new Set(telemetryData.map(t => t.vehicle_id))];
            const insertVehicle = db.prepare('INSERT OR IGNORE INTO vehicles (vehicle_id, car_number) VALUES (?, ?)');
            for (const vehicleId of vehicleIds) {
              const carNumber = parseInt(vehicleId.split('-').pop(), 10);
              insertVehicle.run(vehicleId, carNumber);
            }

            // Import telemetry
            const imported = importTelemetry(db, telemetryData);

            // Query database to count records
            const count = db.prepare('SELECT COUNT(*) as count FROM telemetry').get();

            // Property: imported count should equal database count
            return imported === telemetryData.length && count.count === telemetryData.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve race results record count after import', () => {
      fc.assert(
        fc.property(
          // Generate array of race result records
          fc.array(
            fc.record({
              position: fc.integer({ min: 1, max: 30 }),
              number: fc.integer({ min: 1, max: 99 }),
              laps: fc.integer({ min: 30, max: 50 }),
              total_time: fc.string(),
              gap_first: fc.string(),
              gap_previous: fc.string(),
              best_lap_time: fc.string(),
              class: fc.constantFrom('Pro', 'Am', 'ProAm')
            }),
            { minLength: 1, maxLength: 30 }
          ),
          (resultsData) => {
            // Clear database before each test run
            clearDatabase(db);

            // Ensure unique car numbers to avoid conflicts
            const uniqueResults = [];
            const seenNumbers = new Set();
            for (const result of resultsData) {
              if (!seenNumbers.has(result.number)) {
                seenNumbers.add(result.number);
                uniqueResults.push(result);
              }
            }

            if (uniqueResults.length === 0) return true; // Skip empty case

            // First, insert vehicles to satisfy foreign key constraints
            const insertVehicle = db.prepare('INSERT OR IGNORE INTO vehicles (vehicle_id, car_number) VALUES (?, ?)');
            for (const result of uniqueResults) {
              const vehicleId = `GR86-004-${result.number}`;
              insertVehicle.run(vehicleId, result.number);
            }

            // Import results
            const imported = importResults(db, uniqueResults);

            // Query database to count records
            const count = db.prepare('SELECT COUNT(*) as count FROM race_results').get();

            // Property: imported count should equal database count
            return imported === uniqueResults.length && count.count === uniqueResults.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve section times record count after import', () => {
      fc.assert(
        fc.property(
          // Generate array of section records
          fc.array(
            fc.record({
              number: fc.integer({ min: 1, max: 99 }),
              lap_number: fc.integer({ min: 1, max: 50 }),
              lap_time: fc.string(),
              s1: fc.string(),
              s2: fc.string(),
              s3: fc.string(),
              top_speed: fc.float({ min: 100, max: 200 })
            }),
            { minLength: 1, maxLength: 100 }
          ),
          (sectionsData) => {
            // Clear database before each test run
            clearDatabase(db);

            // First, insert vehicles to satisfy foreign key constraints
            const vehicleNumbers = [...new Set(sectionsData.map(s => s.number))];
            const insertVehicle = db.prepare('INSERT OR IGNORE INTO vehicles (vehicle_id, car_number) VALUES (?, ?)');
            for (const number of vehicleNumbers) {
              const vehicleId = `GR86-004-${number}`;
              insertVehicle.run(vehicleId, number);
            }

            // Import sections
            const imported = importSections(db, sectionsData);

            // Query database to count records
            const count = db.prepare('SELECT COUNT(*) as count FROM section_times').get();

            // Property: imported count should equal database count
            return imported === sectionsData.length && count.count === sectionsData.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve weather record count after import', () => {
      fc.assert(
        fc.property(
          // Generate array of weather records
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              air_temp: fc.float({ min: 10, max: 40 }),
              track_temp: fc.float({ min: 15, max: 60 }),
              humidity: fc.float({ min: 20, max: 100 }),
              pressure: fc.float({ min: 980, max: 1040 }),
              wind_speed: fc.float({ min: 0, max: 30 }),
              wind_direction: fc.float({ min: 0, max: 360 }),
              rain: fc.float({ min: 0, max: 10 })
            }),
            { minLength: 1, maxLength: 100 }
          ),
          (weatherData) => {
            // Clear database before each test run
            clearDatabase(db);

            // Import weather
            const imported = importWeather(db, weatherData);

            // Query database to count records
            const count = db.prepare('SELECT COUNT(*) as count FROM weather').get();

            // Property: imported count should equal database count
            return imported === weatherData.length && count.count === weatherData.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve vehicle record count after import', () => {
      fc.assert(
        fc.property(
          // Generate lap data and results data for vehicles
          fc.tuple(
            fc.array(
              fc.record({
                vehicle_id: fc.constantFrom('GR86-004-78', 'GR86-004-46', 'GR86-004-12'),
                lap: fc.integer({ min: 1, max: 50 }),
                value: fc.integer({ min: 140000, max: 180000 }),
                timestamp: fc.date()
              }),
              { minLength: 1, maxLength: 50 }
            ),
            fc.array(
              fc.record({
                position: fc.integer({ min: 1, max: 30 }),
                number: fc.constantFrom(78, 46, 12),
                laps: fc.integer({ min: 30, max: 50 }),
                total_time: fc.string(),
                gap_first: fc.string(),
                gap_previous: fc.string(),
                best_lap_time: fc.string(),
                class: fc.constantFrom('Pro', 'Am', 'ProAm')
              }),
              { minLength: 0, maxLength: 3 }
            ),
            fc.array(
              fc.record({
                vehicle_id: fc.constantFrom('GR86-004-78', 'GR86-004-46', 'GR86-004-12'),
                lap: fc.integer({ min: 1, max: 50 }),
                timestamp: fc.date(),
                telemetry_name: fc.constantFrom('vCar', 'speed_can'),
                telemetry_value: fc.float({ min: 0, max: 200 })
              }),
              { minLength: 0, maxLength: 50 }
            )
          ),
          ([lapData, resultsData, telemetryData]) => {
            // Clear database before each test run
            clearDatabase(db);

            // Ensure unique results by car number
            const uniqueResults = [];
            const seenNumbers = new Set();
            for (const result of resultsData) {
              if (!seenNumbers.has(result.number)) {
                seenNumbers.add(result.number);
                uniqueResults.push(result);
              }
            }

            // Import vehicles
            const imported = importVehicles(db, lapData, uniqueResults, telemetryData);

            // Query database to count records
            const count = db.prepare('SELECT COUNT(*) as count FROM vehicles').get();

            // Property: imported count should equal database count
            // Note: vehicle count is based on unique vehicle_ids from lap data AND results data
            const vehicleIdsFromLaps = new Set(lapData.map(lap => lap.vehicle_id));
            const vehicleIdsFromResults = new Set(uniqueResults.map(r => `GR86-004-${r.number}`));
            const allVehicleIds = new Set([...vehicleIdsFromLaps, ...vehicleIdsFromResults]);
            const expectedCount = allVehicleIds.size;

            return imported === expectedCount && count.count === expectedCount;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
