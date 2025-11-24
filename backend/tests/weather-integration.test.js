import { describe, it, expect } from 'vitest';
import { parseWeather } from '../parsers/weather-parser.js';
import { analyzeWeather } from '../analyzers/weather-analyzer.js';

describe('Weather Integration Test', () => {
  it('should parse and analyze real weather data', async () => {
    const weatherRecords = await parseWeather('26_Weather_Race 1_Anonymized.CSV');
    
    expect(weatherRecords.length).toBeGreaterThan(0);
    
    const result = analyzeWeather(weatherRecords);
    
    // Verify all metrics are calculated
    expect(result.avgAirTemp).not.toBeNull();
    expect(result.avgTrackTemp).not.toBeNull();
    expect(result.avgHumidity).not.toBeNull();
    expect(result.avgPressure).not.toBeNull();
    expect(result.avgWindSpeed).not.toBeNull();
    
    // Verify min/max are calculated
    expect(result.minTemp).not.toBeNull();
    expect(result.maxTemp).not.toBeNull();
    expect(result.minWindSpeed).not.toBeNull();
    expect(result.maxWindSpeed).not.toBeNull();
    
    // Verify min <= max
    expect(result.minTemp).toBeLessThanOrEqual(result.maxTemp);
    expect(result.minWindSpeed).toBeLessThanOrEqual(result.maxWindSpeed);
    
    // Rain periods should be an array (may be empty if no rain)
    expect(Array.isArray(result.rainPeriods)).toBe(true);
    
    console.log('Weather Analysis Results:');
    console.log(`  Average Air Temp: ${result.avgAirTemp?.toFixed(2)}°C`);
    console.log(`  Average Track Temp: ${result.avgTrackTemp?.toFixed(2)}°C`);
    console.log(`  Average Humidity: ${result.avgHumidity?.toFixed(2)}%`);
    console.log(`  Average Pressure: ${result.avgPressure?.toFixed(2)} hPa`);
    console.log(`  Average Wind Speed: ${result.avgWindSpeed?.toFixed(2)} km/h`);
    console.log(`  Temperature Range: ${result.minTemp?.toFixed(2)}°C - ${result.maxTemp?.toFixed(2)}°C`);
    console.log(`  Wind Speed Range: ${result.minWindSpeed?.toFixed(2)} - ${result.maxWindSpeed?.toFixed(2)} km/h`);
    console.log(`  Rain Periods: ${result.rainPeriods.length}`);
  });
});
