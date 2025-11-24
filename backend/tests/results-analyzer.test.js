import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { analyzeRaceResults } from '../analyzers/results-analyzer.js';

describe('Results Analyzer', () => {
  it('should handle empty input', () => {
    const result = analyzeRaceResults([]);
    expect(result.winner).toBeNull();
    expect(result.totalVehicles).toBe(0);
    expect(result.gaps.length).toBe(0);
    expect(result.byClass.size).toBe(0);
  });

  it('should identify race winner', () => {
    const resultRecords = [
      { position: 1, number: 46, laps: 30, total_time: '1:30:00', gap_first: '0.000', gap_previous: '0.000', best_lap_time: '2:30.000', class: 'Am' },
      { position: 2, number: 7, laps: 30, total_time: '1:30:05', gap_first: '5.000', gap_previous: '5.000', best_lap_time: '2:31.000', class: 'Am' }
    ];

    const result = analyzeRaceResults(resultRecords);
    
    expect(result.winner).not.toBeNull();
    expect(result.winner.position).toBe(1);
    expect(result.winner.number).toBe(46);
  });

  it('should count total vehicles', () => {
    const resultRecords = [
      { position: 1, number: 46, laps: 30, total_time: '1:30:00', gap_first: '0.000', gap_previous: '0.000', best_lap_time: '2:30.000', class: 'Am' },
      { position: 2, number: 7, laps: 30, total_time: '1:30:05', gap_first: '5.000', gap_previous: '5.000', best_lap_time: '2:31.000', class: 'Am' },
      { position: 3, number: 16, laps: 30, total_time: '1:30:10', gap_first: '10.000', gap_previous: '5.000', best_lap_time: '2:32.000', class: 'Am' }
    ];

    const result = analyzeRaceResults(resultRecords);
    
    expect(result.totalVehicles).toBe(3);
  });

  it('should group results by class', () => {
    const resultRecords = [
      { position: 1, number: 46, laps: 30, total_time: '1:30:00', gap_first: '0.000', gap_previous: '0.000', best_lap_time: '2:30.000', class: 'Am' },
      { position: 2, number: 7, laps: 30, total_time: '1:30:05', gap_first: '5.000', gap_previous: '5.000', best_lap_time: '2:31.000', class: 'Pro' },
      { position: 3, number: 16, laps: 30, total_time: '1:30:10', gap_first: '10.000', gap_previous: '5.000', best_lap_time: '2:32.000', class: 'Am' }
    ];

    const result = analyzeRaceResults(resultRecords);
    
    expect(result.byClass.size).toBe(2);
    expect(result.byClass.get('Am').length).toBe(2);
    expect(result.byClass.get('Pro').length).toBe(1);
  });

  // **Feature: racing-data-explorer, Property 10: Gap calculation between consecutive items**
  // **Validates: Requirements 3.2**
  it('property: gap calculation between consecutive positions', () => {
    fc.assert(
      fc.property(
        // Generate an array of race results with at least 2 entries
        fc.array(
          fc.record({
            position: fc.nat(),
            number: fc.integer({ min: 1, max: 999 }),
            laps: fc.integer({ min: 1, max: 100 }),
            total_time: fc.string(),
            gap_first: fc.string(),
            gap_previous: fc.string(),
            best_lap_time: fc.string(),
            class: fc.constantFrom('Am', 'Pro', 'Expert')
          }),
          { minLength: 2, maxLength: 30 }
        ),
        (records) => {
          // Assign sequential positions to ensure valid ordering
          const sortedRecords = records.map((r, idx) => ({
            ...r,
            position: idx + 1
          }));

          const result = analyzeRaceResults(sortedRecords);

          // Property: gaps array should have length = totalVehicles - 1
          // (no gap for first place)
          expect(result.gaps.length).toBe(result.totalVehicles - 1);

          // Property: each gap entry should correspond to positions 2 onwards
          for (let i = 0; i < result.gaps.length; i++) {
            const gap = result.gaps[i];
            const expectedPosition = i + 2; // positions start at 1, gaps start at position 2
            
            expect(gap.position).toBe(expectedPosition);
            
            // Gap should reference the correct vehicle number
            const vehicleAtPosition = sortedRecords.find(r => r.position === expectedPosition);
            expect(gap.number).toBe(vehicleAtPosition.number);
            
            // Gap values should match the original record
            expect(gap.gapToPrevious).toBe(vehicleAtPosition.gap_previous);
            expect(gap.gapToFirst).toBe(vehicleAtPosition.gap_first);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

  // **Feature: racing-data-explorer, Property 11: Grouping by categorical field**
  // **Validates: Requirements 3.5**
  it('property: grouping by categorical field (class)', () => {
    fc.assert(
      fc.property(
        // Generate an array of race results with various classes
        fc.array(
          fc.record({
            position: fc.nat(),
            number: fc.integer({ min: 1, max: 999 }),
            laps: fc.integer({ min: 1, max: 100 }),
            total_time: fc.string(),
            gap_first: fc.string(),
            gap_previous: fc.string(),
            best_lap_time: fc.string(),
            class: fc.constantFrom('Am', 'Pro', 'Expert', 'Rookie')
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (records) => {
          // Assign sequential positions
          const sortedRecords = records.map((r, idx) => ({
            ...r,
            position: idx + 1
          }));

          const result = analyzeRaceResults(sortedRecords);

          // Property 1: All records should be in exactly one group
          let totalRecordsInGroups = 0;
          for (const [className, classRecords] of result.byClass.entries()) {
            totalRecordsInGroups += classRecords.length;
          }
          expect(totalRecordsInGroups).toBe(sortedRecords.length);

          // Property 2: All records in a group should have the same class value
          for (const [className, classRecords] of result.byClass.entries()) {
            for (const record of classRecords) {
              expect(record.class).toBe(className);
            }
          }

          // Property 3: No record should appear in multiple groups
          const seenRecords = new Set();
          for (const [className, classRecords] of result.byClass.entries()) {
            for (const record of classRecords) {
              const key = `${record.position}-${record.number}`;
              expect(seenRecords.has(key)).toBe(false);
              seenRecords.add(key);
            }
          }

          // Property 4: The number of groups should equal the number of unique classes
          const uniqueClasses = new Set(sortedRecords.map(r => r.class));
          expect(result.byClass.size).toBe(uniqueClasses.size);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
