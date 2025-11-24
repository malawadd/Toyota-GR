import { describe, it, expect } from 'vitest';
import { parseLapTimes } from '../parsers/lap-time-parser.js';
import { parseRaceResults } from '../parsers/results-parser.js';
import { parseTelemetry } from '../parsers/telemetry-parser.js';
import { parseWeather } from '../parsers/weather-parser.js';
import { parseSections } from '../parsers/section-parser.js';

describe('Specialized CSV Parsers', () => {
  it('should parse lap time data', async () => {
    const records = await parseLapTimes('COTA_lap_time_R1.csv');
    
    expect(records.length).toBeGreaterThan(0);
    expect(records[0]).toHaveProperty('vehicle_id');
    expect(records[0]).toHaveProperty('lap');
    expect(records[0]).toHaveProperty('value');
    expect(records[0]).toHaveProperty('timestamp');
    expect(typeof records[0].lap).toBe('number');
    expect(typeof records[0].value).toBe('number');
    expect(records[0].timestamp).toBeInstanceOf(Date);
  });

  it('should parse race results data', async () => {
    const records = await parseRaceResults('00_Results GR Cup Race 1 Official_Anonymized.CSV');
    
    expect(records.length).toBeGreaterThan(0);
    expect(records[0]).toHaveProperty('position');
    expect(records[0]).toHaveProperty('number');
    expect(records[0]).toHaveProperty('laps');
    expect(records[0]).toHaveProperty('total_time');
    expect(records[0]).toHaveProperty('gap_first');
    expect(records[0]).toHaveProperty('gap_previous');
    expect(records[0]).toHaveProperty('best_lap_time');
    expect(records[0]).toHaveProperty('class');
    expect(typeof records[0].position).toBe('number');
    expect(typeof records[0].number).toBe('number');
    expect(typeof records[0].laps).toBe('number');
  });

  it('should detect large telemetry files and use streaming', async () => {
    // This test verifies the file size detection and streaming path is triggered
    // Full streaming validation is done via verify-telemetry-streaming.js script
    const fs = await import('fs/promises');
    
    // Verify the file is large enough to trigger streaming (>50MB)
    const stats = await fs.stat('R1_cota_telemetry_data.csv');
    expect(stats.size).toBeGreaterThan(50 * 1024 * 1024);
    
    // Test that the parser can handle the file structure by reading just a few chunks
    const allRecords = [];
    let processedChunks = 0;
    const maxChunksToTest = 2;
    
    // Create a promise that resolves after processing a few chunks
    const testPromise = new Promise((resolve, reject) => {
      parseTelemetry('R1_cota_telemetry_data.csv', (records) => {
        if (processedChunks < maxChunksToTest) {
          allRecords.push(...records);
          processedChunks++;
          
          if (processedChunks === maxChunksToTest) {
            // We've validated the structure, resolve early
            resolve();
          }
        }
      }).catch(reject);
    });
    
    // Wait for a few chunks or timeout
    await Promise.race([
      testPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
    ]);
    
    // Verify we got data and it has the correct structure
    expect(allRecords.length).toBeGreaterThan(0);
    expect(allRecords[0]).toHaveProperty('vehicle_id');
    expect(allRecords[0]).toHaveProperty('timestamp');
    expect(allRecords[0]).toHaveProperty('telemetry_name');
    expect(allRecords[0]).toHaveProperty('telemetry_value');
    expect(allRecords[0]).toHaveProperty('lap');
    expect(allRecords[0].timestamp).toBeInstanceOf(Date);
    expect(typeof allRecords[0].telemetry_value).toBe('number');
    expect(typeof allRecords[0].lap).toBe('number');
  }, 15000);

  it('should parse weather data', async () => {
    const records = await parseWeather('26_Weather_Race 1_Anonymized.CSV');
    
    expect(records.length).toBeGreaterThan(0);
    expect(records[0]).toHaveProperty('timestamp');
    expect(records[0]).toHaveProperty('air_temp');
    expect(records[0]).toHaveProperty('track_temp');
    expect(records[0]).toHaveProperty('humidity');
    expect(records[0]).toHaveProperty('pressure');
    expect(records[0]).toHaveProperty('wind_speed');
    expect(records[0]).toHaveProperty('wind_direction');
    expect(records[0]).toHaveProperty('rain');
    expect(records[0].timestamp).toBeInstanceOf(Date);
    expect(typeof records[0].air_temp).toBe('number');
    expect(typeof records[0].track_temp).toBe('number');
  });

  it('should parse section analysis data', async () => {
    const records = await parseSections('23_AnalysisEnduranceWithSections_Race 1_Anonymized.CSV');
    
    expect(records.length).toBeGreaterThan(0);
    expect(records[0]).toHaveProperty('number');
    expect(records[0]).toHaveProperty('lap_number');
    expect(records[0]).toHaveProperty('lap_time');
    expect(records[0]).toHaveProperty('s1');
    expect(records[0]).toHaveProperty('s2');
    expect(records[0]).toHaveProperty('s3');
    expect(records[0]).toHaveProperty('top_speed');
    expect(typeof records[0].number).toBe('number');
    expect(typeof records[0].lap_number).toBe('number');
    expect(typeof records[0].top_speed).toBe('number');
  });
});
