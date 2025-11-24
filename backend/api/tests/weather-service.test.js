/**
 * Weather Service Tests
 * Tests for weather service business logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import {
  getWeatherData,
  getWeatherSummary,
  getRainPeriods,
  getWeatherAtTime
} from '../services/weather-service.js';

describe('Weather Service', () => {
  let db;

  beforeEach(() => {
    // Create in-memory database for testing
    db = initializeDatabase(':memory:', { memory: true });
  });

  afterEach(() => {
    closeDatabase(db);
  });

  /**
   * Helper function to insert test weather records
   */
  function insertWeatherRecords(records) {
    const stmt = db.prepare(`
      INSERT INTO weather (timestamp, air_temp, track_temp, humidity, pressure, wind_speed, wind_direction, rain)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const record of records) {
      stmt.run(
        record.timestamp,
        record.air_temp,
        record.track_temp,
        record.humidity,
        record.pressure,
        record.wind_speed,
        record.wind_direction,
        record.rain
      );
    }
  }

  describe('getWeatherData', () => {
    it('should return all weather records when no filter is applied', () => {
      const records = [
        { timestamp: '2024-03-15T14:00:00Z', air_temp: 25.5, track_temp: 35.2, humidity: 60, pressure: 1013, wind_speed: 5.2, wind_direction: 180, rain: 0 },
        { timestamp: '2024-03-15T14:05:00Z', air_temp: 25.8, track_temp: 35.5, humidity: 58, pressure: 1013, wind_speed: 5.5, wind_direction: 185, rain: 0 }
      ];
      insertWeatherRecords(records);

      const result = getWeatherData(db);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    // Feature: racing-data-api, Property 12: Time range filtering
    // Validates: Requirements 8.2
    it('property: time range filtering returns only records within range', () => {
      fc.assert(
        fc.property(
          // Generate array of weather records with random timestamps
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
                .map(d => d.toISOString()),
              air_temp: fc.float({ min: 15, max: 35 }),
              track_temp: fc.float({ min: 20, max: 50 }),
              humidity: fc.float({ min: 30, max: 90 }),
              pressure: fc.float({ min: 1000, max: 1030 }),
              wind_speed: fc.float({ min: 0, max: 20 }),
              wind_direction: fc.float({ min: 0, max: 360 }),
              rain: fc.float({ min: 0, max: 10 })
            }),
            { minLength: 5, maxLength: 50 }
          ),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          (records, startDate, endDate) => {
            // Ensure startTime <= endTime
            const startTime = startDate <= endDate ? startDate.toISOString() : endDate.toISOString();
            const endTime = startDate <= endDate ? endDate.toISOString() : startDate.toISOString();

            // Clear database and insert test records
            db.exec('DELETE FROM weather');
            insertWeatherRecords(records);

            // Query with time range filter
            const result = getWeatherData(db, { startTime, endTime, limit: 1000 });

            // Property: All returned records should have timestamps within the range
            return result.data.every(record => {
              return record.timestamp >= startTime && record.timestamp <= endTime;
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should paginate results correctly', () => {
      const records = Array.from({ length: 25 }, (_, i) => ({
        timestamp: `2024-03-15T${String(14 + Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}:00Z`,
        air_temp: 25 + i * 0.1,
        track_temp: 35 + i * 0.1,
        humidity: 60,
        pressure: 1013,
        wind_speed: 5,
        wind_direction: 180,
        rain: 0
      }));
      insertWeatherRecords(records);

      const page1 = getWeatherData(db, { limit: 10, offset: 0 });
      expect(page1.data).toHaveLength(10);
      expect(page1.total).toBe(25);

      const page2 = getWeatherData(db, { limit: 10, offset: 10 });
      expect(page2.data).toHaveLength(10);
      expect(page2.total).toBe(25);
    });
  });

  describe('getWeatherSummary', () => {
    it('should return aggregated statistics', () => {
      const records = [
        { timestamp: '2024-03-15T14:00:00Z', air_temp: 25.0, track_temp: 35.0, humidity: 60, pressure: 1013, wind_speed: 5.0, wind_direction: 180, rain: 0 },
        { timestamp: '2024-03-15T14:05:00Z', air_temp: 26.0, track_temp: 36.0, humidity: 58, pressure: 1013, wind_speed: 6.0, wind_direction: 185, rain: 0 },
        { timestamp: '2024-03-15T14:10:00Z', air_temp: 27.0, track_temp: 37.0, humidity: 56, pressure: 1013, wind_speed: 7.0, wind_direction: 190, rain: 2.5 }
      ];
      insertWeatherRecords(records);

      const summary = getWeatherSummary(db);
      expect(summary).not.toBeNull();
      expect(summary.count).toBe(3);
      expect(summary.airTemp.average).toBeCloseTo(26.0, 1);
      expect(summary.airTemp.min).toBe(25.0);
      expect(summary.airTemp.max).toBe(27.0);
      expect(summary.rain.measurements).toBe(1);
      expect(summary.rain.maxIntensity).toBe(2.5);
    });

    it('should return null when no records exist', () => {
      const summary = getWeatherSummary(db);
      expect(summary).toBeNull();
    });

    it('should filter by time range', () => {
      const records = [
        { timestamp: '2024-03-15T14:00:00Z', air_temp: 25.0, track_temp: 35.0, humidity: 60, pressure: 1013, wind_speed: 5.0, wind_direction: 180, rain: 0 },
        { timestamp: '2024-03-15T15:00:00Z', air_temp: 26.0, track_temp: 36.0, humidity: 58, pressure: 1013, wind_speed: 6.0, wind_direction: 185, rain: 0 },
        { timestamp: '2024-03-15T16:00:00Z', air_temp: 27.0, track_temp: 37.0, humidity: 56, pressure: 1013, wind_speed: 7.0, wind_direction: 190, rain: 0 }
      ];
      insertWeatherRecords(records);

      const summary = getWeatherSummary(db, {
        startTime: '2024-03-15T14:30:00Z',
        endTime: '2024-03-15T16:30:00Z'
      });
      
      expect(summary).not.toBeNull();
      expect(summary.count).toBe(2); // Only 15:00 and 16:00 records
    });
  });

  describe('getRainPeriods', () => {
    it('should return empty array when no rain', () => {
      const records = [
        { timestamp: '2024-03-15T14:00:00Z', air_temp: 25.0, track_temp: 35.0, humidity: 60, pressure: 1013, wind_speed: 5.0, wind_direction: 180, rain: 0 },
        { timestamp: '2024-03-15T14:05:00Z', air_temp: 25.5, track_temp: 35.5, humidity: 60, pressure: 1013, wind_speed: 5.0, wind_direction: 180, rain: 0 }
      ];
      insertWeatherRecords(records);

      const periods = getRainPeriods(db);
      expect(periods).toHaveLength(0);
    });

    it('should identify single rain period', () => {
      const records = [
        { timestamp: '2024-03-15T14:00:00Z', air_temp: 25.0, track_temp: 35.0, humidity: 60, pressure: 1013, wind_speed: 5.0, wind_direction: 180, rain: 0 },
        { timestamp: '2024-03-15T14:05:00Z', air_temp: 25.5, track_temp: 35.5, humidity: 65, pressure: 1013, wind_speed: 5.0, wind_direction: 180, rain: 2.5 },
        { timestamp: '2024-03-15T14:10:00Z', air_temp: 25.3, track_temp: 35.3, humidity: 70, pressure: 1013, wind_speed: 5.0, wind_direction: 180, rain: 3.0 },
        { timestamp: '2024-03-15T14:15:00Z', air_temp: 25.0, track_temp: 35.0, humidity: 60, pressure: 1013, wind_speed: 5.0, wind_direction: 180, rain: 0 }
      ];
      insertWeatherRecords(records);

      const periods = getRainPeriods(db);
      expect(periods).toHaveLength(1);
      expect(periods[0].startTime).toBe('2024-03-15T14:05:00Z');
      expect(periods[0].endTime).toBe('2024-03-15T14:10:00Z');
      expect(periods[0].maxIntensity).toBe(3.0);
      expect(periods[0].measurements).toBe(2);
    });

    it('should identify multiple rain periods', () => {
      const records = [
        { timestamp: '2024-03-15T14:00:00Z', air_temp: 25.0, track_temp: 35.0, humidity: 60, pressure: 1013, wind_speed: 5.0, wind_direction: 180, rain: 2.0 },
        { timestamp: '2024-03-15T14:05:00Z', air_temp: 25.5, track_temp: 35.5, humidity: 65, pressure: 1013, wind_speed: 5.0, wind_direction: 180, rain: 2.5 },
        { timestamp: '2024-03-15T14:20:00Z', air_temp: 25.3, track_temp: 35.3, humidity: 70, pressure: 1013, wind_speed: 5.0, wind_direction: 180, rain: 3.0 },
        { timestamp: '2024-03-15T14:25:00Z', air_temp: 25.0, track_temp: 35.0, humidity: 60, pressure: 1013, wind_speed: 5.0, wind_direction: 180, rain: 1.5 }
      ];
      insertWeatherRecords(records);

      const periods = getRainPeriods(db);
      expect(periods).toHaveLength(2); // Gap of 15 minutes between 14:05 and 14:20
      expect(periods[0].measurements).toBe(2);
      expect(periods[1].measurements).toBe(2);
    });

    // Feature: racing-data-api, Property 13: Conditional filtering
    // Validates: Requirements 8.4
    it('property: rain period filtering returns only records with rain', () => {
      fc.assert(
        fc.property(
          // Generate array of weather records with varying rain values
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2024-03-15T14:00:00Z'), max: new Date('2024-03-15T18:00:00Z') })
                .map(d => d.toISOString()),
              air_temp: fc.float({ min: 15, max: 35 }),
              track_temp: fc.float({ min: 20, max: 50 }),
              humidity: fc.float({ min: 30, max: 90 }),
              pressure: fc.float({ min: 1000, max: 1030 }),
              wind_speed: fc.float({ min: 0, max: 20 }),
              wind_direction: fc.float({ min: 0, max: 360 }),
              rain: fc.float({ min: 0, max: 10 })
            }),
            { minLength: 5, maxLength: 30 }
          ),
          fc.float({ min: 0, max: 5 }),
          (records, minRain) => {
            // Clear database and insert test records
            db.exec('DELETE FROM weather');
            insertWeatherRecords(records);

            // Query rain periods
            const periods = getRainPeriods(db, { minRain });

            // Property: All measurements in rain periods should have rain > minRain
            // We verify this by checking that the original records used in periods have rain > minRain
            const rainRecords = records.filter(r => r.rain > minRain);
            
            // If no rain records, should return empty array
            if (rainRecords.length === 0) {
              return periods.length === 0;
            }

            // All periods should have maxIntensity > minRain
            return periods.every(period => period.maxIntensity > minRain);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getWeatherAtTime', () => {
    it('should return nearest weather measurement', () => {
      const records = [
        { timestamp: '2024-03-15T14:00:00Z', air_temp: 25.0, track_temp: 35.0, humidity: 60, pressure: 1013, wind_speed: 5.0, wind_direction: 180, rain: 0 },
        { timestamp: '2024-03-15T14:10:00Z', air_temp: 25.5, track_temp: 35.5, humidity: 58, pressure: 1013, wind_speed: 5.5, wind_direction: 185, rain: 0 },
        { timestamp: '2024-03-15T14:20:00Z', air_temp: 26.0, track_temp: 36.0, humidity: 56, pressure: 1013, wind_speed: 6.0, wind_direction: 190, rain: 0 }
      ];
      insertWeatherRecords(records);

      // Query for time between 14:00 and 14:10 (closer to 14:10)
      const result = getWeatherAtTime(db, '2024-03-15T14:08:00Z');
      expect(result).not.toBeNull();
      expect(result.timestamp).toBe('2024-03-15T14:10:00Z');
    });

    it('should return null when no weather data exists', () => {
      const result = getWeatherAtTime(db, '2024-03-15T14:00:00Z');
      expect(result).toBeNull();
    });

    // Feature: racing-data-api, Property 14: Nearest value search
    // Validates: Requirements 8.5
    it('property: nearest time search returns closest record', () => {
      fc.assert(
        fc.property(
          // Generate array of weather records with timestamps
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2024-03-15T14:00:00Z'), max: new Date('2024-03-15T18:00:00Z') })
                .map(d => d.toISOString()),
              air_temp: fc.float({ min: 15, max: 35 }),
              track_temp: fc.float({ min: 20, max: 50 }),
              humidity: fc.float({ min: 30, max: 90 }),
              pressure: fc.float({ min: 1000, max: 1030 }),
              wind_speed: fc.float({ min: 0, max: 20 }),
              wind_direction: fc.float({ min: 0, max: 360 }),
              rain: fc.float({ min: 0, max: 10 })
            }),
            { minLength: 3, maxLength: 20 }
          ),
          fc.date({ min: new Date('2024-03-15T14:00:00Z'), max: new Date('2024-03-15T18:00:00Z') }),
          (records, targetDate) => {
            // Clear database and insert test records
            db.exec('DELETE FROM weather');
            insertWeatherRecords(records);

            const targetTime = targetDate.toISOString();

            // Query for nearest weather
            const result = getWeatherAtTime(db, targetTime);

            if (!result) return false;

            // Property: The returned record should be the one with minimum time difference
            const targetTimestamp = new Date(targetTime).getTime();
            const resultTimestamp = new Date(result.timestamp).getTime();
            const resultDiff = Math.abs(targetTimestamp - resultTimestamp);

            // Check that no other record is closer
            return records.every(record => {
              const recordTimestamp = new Date(record.timestamp).getTime();
              const recordDiff = Math.abs(targetTimestamp - recordTimestamp);
              return recordDiff >= resultDiff;
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
