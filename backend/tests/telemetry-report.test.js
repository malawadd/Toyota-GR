import { describe, it, expect, afterEach } from 'vitest';
import { generateTelemetryReport } from '../reporters/telemetry-report.js';
import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';

describe('Telemetry Report Generator', () => {
  const testOutputPath = 'test-telemetry-report.md';
  
  afterEach(async () => {
    if (existsSync(testOutputPath)) {
      await unlink(testOutputPath);
    }
  });

  it('should generate a markdown report with telemetry statistics', async () => {
    const analysis = {
      maxSpeed: 205.3,
      avgSpeed: 180.5,
      maxBrakeFront: 95.2,
      maxBrakeRear: 85.7,
      byVehicle: new Map([
        ['GR86-001', {
          vehicle: 'GR86-001',
          maxSpeed: 205.3,
          avgSpeed: 182.1,
          maxBrakeFront: 95.2,
          maxBrakeRear: 85.7
        }],
        ['GR86-002', {
          vehicle: 'GR86-002',
          maxSpeed: 203.8,
          avgSpeed: 178.9,
          maxBrakeFront: 92.5,
          maxBrakeRear: 83.2
        }]
      ])
    };

    await generateTelemetryReport(analysis, testOutputPath);
    
    expect(existsSync(testOutputPath)).toBe(true);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('# Telemetry Analysis Report');
    expect(content).toContain('## Overall Statistics');
    expect(content).toContain('**Maximum Speed**: 205.30 km/h');
    expect(content).toContain('**Average Speed**: 180.50 km/h');
    expect(content).toContain('**Maximum Front Brake Pressure**: 95.20 bar');
    expect(content).toContain('**Maximum Rear Brake Pressure**: 85.70 bar');
    expect(content).toContain('## Vehicle Statistics');
    expect(content).toContain('| Vehicle | Max Speed (km/h) | Avg Speed (km/h) | Max Brake Front (bar) | Max Brake Rear (bar) |');
  });

  it('should handle empty vehicle data', async () => {
    const analysis = {
      maxSpeed: 205.3,
      avgSpeed: 180.5,
      maxBrakeFront: 95.2,
      maxBrakeRear: 85.7,
      byVehicle: new Map()
    };

    await generateTelemetryReport(analysis, testOutputPath);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('# Telemetry Analysis Report');
    expect(content).toContain('## Overall Statistics');
    expect(content).not.toContain('## Vehicle Statistics');
  });

  it('should format numbers with 2 decimal places', async () => {
    const analysis = {
      maxSpeed: 205.345,
      avgSpeed: 180.567,
      maxBrakeFront: 95.234,
      maxBrakeRear: 85.789,
      byVehicle: new Map()
    };

    await generateTelemetryReport(analysis, testOutputPath);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('205.34 km/h');
    expect(content).toContain('180.57 km/h');
    expect(content).toContain('95.23 bar');
    expect(content).toContain('85.79 bar');
  });
});
