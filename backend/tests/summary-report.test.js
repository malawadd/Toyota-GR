import { describe, it, expect, afterEach } from 'vitest';
import { generateSummaryReport } from '../reporters/summary-report.js';
import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';

describe('Summary Report Generator', () => {
  const testOutputPath = 'test-summary-report.md';
  
  afterEach(async () => {
    if (existsSync(testOutputPath)) {
      await unlink(testOutputPath);
    }
  });

  it('should generate a comprehensive summary report', async () => {
    const allAnalysis = {
      results: {
        totalVehicles: 15,
        winner: {
          number: 46,
          total_time: '46:00.172',
          laps: 17,
          best_lap_time: '2:28.745',
          class: 'Am'
        }
      },
      laps: {
        fastest: 148630,
        average: 152000,
        stdDev: 3500,
        rankings: [
          { rank: 1, vehicle: 'GR86-001', fastest: 148630, lapCount: 17 },
          { rank: 2, vehicle: 'GR86-002', fastest: 150000, lapCount: 17 },
          { rank: 3, vehicle: 'GR86-003', fastest: 151000, lapCount: 17 }
        ]
      },
      telemetry: {
        maxSpeed: 206.9,
        avgSpeed: 180.5,
        maxBrakeFront: 95.2,
        maxBrakeRear: 85.7
      },
      weather: {
        avgAirTemp: 28.7,
        avgTrackTemp: 41.2,
        avgHumidity: 62.5,
        avgWindSpeed: 12.8,
        minTemp: 28.5,
        maxTemp: 29.1,
        minWindSpeed: 5.0,
        maxWindSpeed: 23.8,
        rainPeriods: []
      },
      sections: {
        fastestBySection: new Map([
          ['S1', 32769],
          ['S2', 57341],
          ['S3', 59820]
        ]),
        avgBySection: new Map([
          ['S1', 35000],
          ['S2', 60000],
          ['S3', 62000]
        ]),
        fastestVehicleBySection: new Map([
          ['S1', { vehicle: 13, time: 32769 }],
          ['S2', { vehicle: 13, time: 57341 }],
          ['S3', { vehicle: 13, time: 59820 }]
        ])
      },
      duration: 2760000 // 46 minutes
    };

    await generateSummaryReport(allAnalysis, testOutputPath);
    
    expect(existsSync(testOutputPath)).toBe(true);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('# Race Data Summary Report');
    expect(content).toContain('## Race Overview');
    expect(content).toContain('**Total Vehicles**: 15');
    expect(content).toContain('**Race Duration**: 46:00.000');
    expect(content).toContain('**Fastest Lap**: 2:28.630');
    expect(content).toContain('## Race Winner');
    expect(content).toContain('🏆 **Car #46**');
    expect(content).toContain('## Lap Performance');
    expect(content).toContain('## Telemetry Highlights');
    expect(content).toContain('**Maximum Speed**: 206.90 km/h');
    expect(content).toContain('## Weather Conditions');
    expect(content).toContain('**Air Temperature**: 28.7°C');
    expect(content).toContain('## Track Section Performance');
    expect(content).toContain('**S1**: 0:32.769 (Vehicle #13)');
  });

  it('should handle missing data gracefully', async () => {
    const allAnalysis = {
      results: {
        totalVehicles: 10
      }
    };

    await generateSummaryReport(allAnalysis, testOutputPath);
    
    expect(existsSync(testOutputPath)).toBe(true);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('# Race Data Summary Report');
    expect(content).toContain('**Total Vehicles**: 10');
  });

  it('should display top 3 vehicles', async () => {
    const allAnalysis = {
      laps: {
        fastest: 148630,
        average: 152000,
        stdDev: 3500,
        rankings: [
          { rank: 1, vehicle: 'GR86-001', fastest: 148630, lapCount: 17 },
          { rank: 2, vehicle: 'GR86-002', fastest: 150000, lapCount: 17 },
          { rank: 3, vehicle: 'GR86-003', fastest: 151000, lapCount: 17 }
        ]
      }
    };

    await generateSummaryReport(allAnalysis, testOutputPath);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('**Top 3 Vehicles:**');
    expect(content).toContain('1. Vehicle GR86-001 - 2:28.630');
    expect(content).toContain('2. Vehicle GR86-002 - 2:30.000');
    expect(content).toContain('3. Vehicle GR86-003 - 2:31.000');
  });

  it('should indicate when no rain was detected', async () => {
    const allAnalysis = {
      weather: {
        avgAirTemp: 28.7,
        avgTrackTemp: 41.2,
        avgHumidity: 62.5,
        avgWindSpeed: 12.8,
        minTemp: 28.5,
        maxTemp: 29.1,
        minWindSpeed: 5.0,
        maxWindSpeed: 23.8,
        rainPeriods: []
      }
    };

    await generateSummaryReport(allAnalysis, testOutputPath);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('**Rain**: No rain detected');
  });
});
