import { describe, it, expect, afterEach } from 'vitest';
import { generateWeatherReport } from '../reporters/weather-report.js';
import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';

describe('Weather Report Generator', () => {
  const testOutputPath = 'test-weather-report.md';
  
  afterEach(async () => {
    if (existsSync(testOutputPath)) {
      await unlink(testOutputPath);
    }
  });

  it('should generate a markdown report with weather statistics', async () => {
    const analysis = {
      avgAirTemp: 28.70,
      avgTrackTemp: 41.23,
      avgHumidity: 62.55,
      avgPressure: 993.11,
      avgWindSpeed: 12.75,
      minTemp: 28.50,
      maxTemp: 29.12,
      minWindSpeed: 5.04,
      maxWindSpeed: 23.76,
      rainPeriods: []
    };

    await generateWeatherReport(analysis, testOutputPath);
    
    expect(existsSync(testOutputPath)).toBe(true);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('# Weather Analysis Report');
    expect(content).toContain('## Average Conditions');
    expect(content).toContain('**Air Temperature**: 28.70°C');
    expect(content).toContain('**Track Temperature**: 41.23°C');
    expect(content).toContain('**Humidity**: 62.55%');
    expect(content).toContain('**Pressure**: 993.11 hPa');
    expect(content).toContain('**Wind Speed**: 12.75 km/h');
    expect(content).toContain('## Temperature Range');
    expect(content).toContain('**Minimum**: 28.50°C');
    expect(content).toContain('**Maximum**: 29.12°C');
    expect(content).toContain('## Wind Speed Range');
    expect(content).toContain('## Rain Periods');
    expect(content).toContain('No rain detected');
  });

  it('should display rain periods when present', async () => {
    const analysis = {
      avgAirTemp: 20.0,
      avgTrackTemp: 25.0,
      avgHumidity: 75.0,
      avgPressure: 1010.0,
      avgWindSpeed: 10.0,
      minTemp: 18.0,
      maxTemp: 22.0,
      minWindSpeed: 5.0,
      maxWindSpeed: 15.0,
      rainPeriods: [
        {
          timestamp: new Date('2024-01-01T10:00:00Z'),
          rain: 2.5,
          air_temp: 19.0,
          track_temp: 24.0
        },
        {
          timestamp: new Date('2024-01-01T10:05:00Z'),
          rain: 5.0,
          air_temp: 18.5,
          track_temp: 23.5
        }
      ]
    };

    await generateWeatherReport(analysis, testOutputPath);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('**Total Rain Periods**: 2');
    expect(content).toContain('| Timestamp | Rain (mm) | Air Temp (°C) | Track Temp (°C) |');
    expect(content).toContain('2024-01-01T10:00:00.000Z');
    expect(content).toContain('2.50');
    expect(content).toContain('19.00');
  });

  it('should calculate temperature and wind speed ranges', async () => {
    const analysis = {
      avgAirTemp: 25.0,
      avgTrackTemp: 30.0,
      avgHumidity: 60.0,
      avgPressure: 1013.0,
      avgWindSpeed: 10.0,
      minTemp: 20.0,
      maxTemp: 30.0,
      minWindSpeed: 5.0,
      maxWindSpeed: 20.0,
      rainPeriods: []
    };

    await generateWeatherReport(analysis, testOutputPath);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('**Range**: 10.00°C');
    expect(content).toContain('**Range**: 15.00 km/h');
  });
});
