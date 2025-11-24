import { describe, test, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { generateVehicleReport } from '../reporters/vehicle-report.js';
import { analyzeVehicleData } from '../analyzers/vehicle-analyzer.js';
import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';

describe('Vehicle Report Generator', () => {
  const testOutputPath = 'test-vehicle-report.md';
  
  afterEach(async () => {
    // Clean up test file
    if (existsSync(testOutputPath)) {
      await unlink(testOutputPath);
    }
  });

  // **Feature: racing-data-explorer, Property 26: Unified report completeness**
  // **Validates: Requirements 11.5**
  test('Property 26: Unified report contains all data sections when data exists', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate vehicle data with all sections populated
        fc.record({
          vehicleId: fc.string({ minLength: 5, maxLength: 20 }),
          carNumber: fc.integer({ min: 1, max: 999 }),
          class: fc.constantFrom('Am', 'Pro', 'Pro-Am'),
          lapTimes: fc.array(
            fc.record({
              vehicle_id: fc.string({ minLength: 5, maxLength: 20 }),
              lap: fc.integer({ min: 1, max: 100 }),
              value: fc.integer({ min: 60000, max: 300000 }),
              timestamp: fc.date()
            }),
            { minLength: 1, maxLength: 20 }
          ),
          raceResult: fc.record({
            position: fc.integer({ min: 1, max: 50 }),
            number: fc.integer({ min: 1, max: 999 }),
            laps: fc.integer({ min: 1, max: 100 }),
            total_time: fc.string({ minLength: 5, maxLength: 15 }),
            gap_first: fc.string({ minLength: 3, maxLength: 10 }),
            gap_previous: fc.string({ minLength: 3, maxLength: 10 }),
            best_lap_time: fc.string({ minLength: 5, maxLength: 15 }),
            class: fc.constantFrom('Am', 'Pro', 'Pro-Am')
          }),
          telemetry: fc.array(
            fc.record({
              vehicle_id: fc.string({ minLength: 5, maxLength: 20 }),
              timestamp: fc.date(),
              telemetry_name: fc.constantFrom('vCar', 'speed_can', 'brake_front', 'brake_rear', 'throttle'),
              telemetry_value: fc.float({ min: 0, max: 300 })
            }),
            { minLength: 10, maxLength: 50 }
          ),
          sections: fc.array(
            fc.record({
              number: fc.integer({ min: 1, max: 999 }),
              lap_number: fc.integer({ min: 1, max: 100 }),
              lap_time: fc.integer({ min: 1, max: 5 }).map(m => `${m}:${(Math.random() * 60).toFixed(3).padStart(6, '0')}`),
              s1: fc.integer({ min: 0, max: 2 }).map(m => `${m}:${(Math.random() * 60).toFixed(3).padStart(6, '0')}`),
              s2: fc.integer({ min: 0, max: 2 }).map(m => `${m}:${(Math.random() * 60).toFixed(3).padStart(6, '0')}`),
              s3: fc.integer({ min: 0, max: 2 }).map(m => `${m}:${(Math.random() * 60).toFixed(3).padStart(6, '0')}`),
              top_speed: fc.float({ min: 50, max: 250 })
            }),
            { minLength: 1, maxLength: 20 }
          )
        }),
        async (vehicleData) => {
          // Ensure vehicle IDs match in lap times and telemetry
          vehicleData.lapTimes.forEach(lt => lt.vehicle_id = vehicleData.vehicleId);
          vehicleData.telemetry.forEach(t => t.vehicle_id = vehicleData.vehicleId);
          vehicleData.sections.forEach(s => s.number = vehicleData.carNumber);
          vehicleData.raceResult.number = vehicleData.carNumber;
          
          // Analyze the vehicle data
          const analysis = analyzeVehicleData(vehicleData);
          
          // Generate the report
          await generateVehicleReport(analysis, testOutputPath);
          
          // Read the generated report
          const content = await readFile(testOutputPath, 'utf-8');
          
          // Property: Report should contain all major sections when data exists
          const hasOverview = content.includes('## Overview');
          const hasLapTimes = content.includes('## Lap Times');
          const hasRaceResults = content.includes('## Race Results');
          const hasTelemetry = content.includes('## Telemetry');
          const hasSectionAnalysis = content.includes('## Section Analysis');
          
          // Property: Report should contain vehicle identification
          const hasVehicleId = content.includes(vehicleData.vehicleId);
          const hasCarNumber = content.includes(`#${vehicleData.carNumber}`);
          
          // All sections should be present when data exists
          return (
            hasOverview &&
            hasLapTimes &&
            hasRaceResults &&
            hasTelemetry &&
            hasSectionAnalysis &&
            hasVehicleId &&
            hasCarNumber
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 26: Report handles missing lap time data gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          vehicleId: fc.string({ minLength: 5, maxLength: 20 }),
          carNumber: fc.integer({ min: 1, max: 999 }),
          class: fc.constantFrom('Am', 'Pro', 'Pro-Am'),
          lapTimes: fc.constant([]), // Empty lap times
          raceResult: fc.record({
            position: fc.integer({ min: 1, max: 50 }),
            number: fc.integer({ min: 1, max: 999 }),
            laps: fc.integer({ min: 1, max: 100 }),
            total_time: fc.string({ minLength: 5, maxLength: 15 }),
            gap_first: fc.string({ minLength: 3, maxLength: 10 }),
            gap_previous: fc.string({ minLength: 3, maxLength: 10 }),
            best_lap_time: fc.string({ minLength: 5, maxLength: 15 }),
            class: fc.constantFrom('Am', 'Pro', 'Pro-Am')
          }),
          telemetry: fc.constant([]),
          sections: fc.constant([])
        }),
        async (vehicleData) => {
          vehicleData.raceResult.number = vehicleData.carNumber;
          
          const analysis = analyzeVehicleData(vehicleData);
          await generateVehicleReport(analysis, testOutputPath);
          
          const content = await readFile(testOutputPath, 'utf-8');
          
          // Property: Report should still have overview and race results
          const hasOverview = content.includes('## Overview');
          const hasRaceResults = content.includes('## Race Results');
          
          // Property: Should not have lap times section when no lap data
          const hasLapTimes = content.includes('## Lap Times');
          
          return hasOverview && hasRaceResults && !hasLapTimes;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 26: Report handles missing telemetry data gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          vehicleId: fc.string({ minLength: 5, maxLength: 20 }),
          carNumber: fc.integer({ min: 1, max: 999 }),
          class: fc.constantFrom('Am', 'Pro', 'Pro-Am'),
          lapTimes: fc.array(
            fc.record({
              vehicle_id: fc.string({ minLength: 5, maxLength: 20 }),
              lap: fc.integer({ min: 1, max: 100 }),
              value: fc.integer({ min: 60000, max: 300000 }),
              timestamp: fc.date()
            }),
            { minLength: 1, maxLength: 10 }
          ),
          raceResult: fc.record({
            position: fc.integer({ min: 1, max: 50 }),
            number: fc.integer({ min: 1, max: 999 }),
            laps: fc.integer({ min: 1, max: 100 }),
            total_time: fc.string({ minLength: 5, maxLength: 15 }),
            gap_first: fc.string({ minLength: 3, maxLength: 10 }),
            gap_previous: fc.string({ minLength: 3, maxLength: 10 }),
            best_lap_time: fc.string({ minLength: 5, maxLength: 15 }),
            class: fc.constantFrom('Am', 'Pro', 'Pro-Am')
          }),
          telemetry: fc.constant([]), // Empty telemetry
          sections: fc.constant([])
        }),
        async (vehicleData) => {
          vehicleData.lapTimes.forEach(lt => lt.vehicle_id = vehicleData.vehicleId);
          vehicleData.raceResult.number = vehicleData.carNumber;
          
          const analysis = analyzeVehicleData(vehicleData);
          await generateVehicleReport(analysis, testOutputPath);
          
          const content = await readFile(testOutputPath, 'utf-8');
          
          // Property: Report should have overview, lap times, and race results
          const hasOverview = content.includes('## Overview');
          const hasLapTimes = content.includes('## Lap Times');
          const hasRaceResults = content.includes('## Race Results');
          
          // Property: Should not have telemetry section when no telemetry data
          const hasTelemetry = content.includes('## Telemetry');
          
          return hasOverview && hasLapTimes && hasRaceResults && !hasTelemetry;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 26: Report handles missing section data gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          vehicleId: fc.string({ minLength: 5, maxLength: 20 }),
          carNumber: fc.integer({ min: 1, max: 999 }),
          class: fc.constantFrom('Am', 'Pro', 'Pro-Am'),
          lapTimes: fc.array(
            fc.record({
              vehicle_id: fc.string({ minLength: 5, maxLength: 20 }),
              lap: fc.integer({ min: 1, max: 100 }),
              value: fc.integer({ min: 60000, max: 300000 }),
              timestamp: fc.date()
            }),
            { minLength: 1, maxLength: 10 }
          ),
          raceResult: fc.record({
            position: fc.integer({ min: 1, max: 50 }),
            number: fc.integer({ min: 1, max: 999 }),
            laps: fc.integer({ min: 1, max: 100 }),
            total_time: fc.string({ minLength: 5, maxLength: 15 }),
            gap_first: fc.string({ minLength: 3, maxLength: 10 }),
            gap_previous: fc.string({ minLength: 3, maxLength: 10 }),
            best_lap_time: fc.string({ minLength: 5, maxLength: 15 }),
            class: fc.constantFrom('Am', 'Pro', 'Pro-Am')
          }),
          telemetry: fc.constant([]),
          sections: fc.constant([]) // Empty sections
        }),
        async (vehicleData) => {
          vehicleData.lapTimes.forEach(lt => lt.vehicle_id = vehicleData.vehicleId);
          vehicleData.raceResult.number = vehicleData.carNumber;
          
          const analysis = analyzeVehicleData(vehicleData);
          await generateVehicleReport(analysis, testOutputPath);
          
          const content = await readFile(testOutputPath, 'utf-8');
          
          // Property: Report should have overview, lap times, and race results
          const hasOverview = content.includes('## Overview');
          const hasLapTimes = content.includes('## Lap Times');
          const hasRaceResults = content.includes('## Race Results');
          
          // Property: Should not have section analysis when no section data
          const hasSectionAnalysis = content.includes('## Section Analysis');
          
          return hasOverview && hasLapTimes && hasRaceResults && !hasSectionAnalysis;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 26: Report file has .md extension', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          vehicleId: fc.string({ minLength: 5, maxLength: 20 }),
          carNumber: fc.integer({ min: 1, max: 999 }),
          class: fc.constantFrom('Am', 'Pro', 'Pro-Am'),
          lapTimes: fc.constant([]),
          raceResult: fc.constant(null),
          telemetry: fc.constant([]),
          sections: fc.constant([])
        }),
        async (vehicleData) => {
          const analysis = analyzeVehicleData(vehicleData);
          await generateVehicleReport(analysis, testOutputPath);
          
          // Property: File should exist and have .md extension
          const fileExists = existsSync(testOutputPath);
          const hasMdExtension = testOutputPath.endsWith('.md');
          
          return fileExists && hasMdExtension;
        }
      ),
      { numRuns: 100 }
    );
  });
});
