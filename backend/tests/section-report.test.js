import { describe, it, expect, afterEach } from 'vitest';
import { generateSectionReport } from '../reporters/section-report.js';
import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';

describe('Section Report Generator', () => {
  const testOutputPath = 'test-section-report.md';
  
  afterEach(async () => {
    if (existsSync(testOutputPath)) {
      await unlink(testOutputPath);
    }
  });

  it('should generate a markdown report with section statistics', async () => {
    const analysis = {
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
    };

    await generateSectionReport(analysis, testOutputPath);
    
    expect(existsSync(testOutputPath)).toBe(true);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('# Section Analysis Report');
    expect(content).toContain('## Fastest Times by Section');
    expect(content).toContain('| Section | Fastest Time | Fastest Vehicle |');
    expect(content).toContain('| S1 | 0:32.769 | #13 |');
    expect(content).toContain('| S2 | 0:57.341 | #13 |');
    expect(content).toContain('| S3 | 0:59.820 | #13 |');
    expect(content).toContain('## Average Times by Section');
    expect(content).toContain('## Section Performance Summary');
  });

  it('should display section performance summary', async () => {
    const analysis = {
      fastestBySection: new Map([
        ['S1', 32000],
        ['S2', 57000],
        ['S3', 59000]
      ]),
      avgBySection: new Map([
        ['S1', 35000],
        ['S2', 60000],
        ['S3', 62000]
      ]),
      fastestVehicleBySection: new Map([
        ['S1', { vehicle: 13, time: 32000 }],
        ['S2', { vehicle: 11, time: 57000 }],
        ['S3', { vehicle: 3, time: 59000 }]
      ])
    };

    await generateSectionReport(analysis, testOutputPath);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('**S1**');
    expect(content).toContain('- Fastest: 0:32.000 (Vehicle #13)');
    expect(content).toContain('- Average: 0:35.000');
    expect(content).toContain('- Delta: 0:03.000');
    
    expect(content).toContain('**S2**');
    expect(content).toContain('- Fastest: 0:57.000 (Vehicle #11)');
    
    expect(content).toContain('**S3**');
    expect(content).toContain('- Fastest: 0:59.000 (Vehicle #3)');
  });

  it('should handle empty section data', async () => {
    const analysis = {
      fastestBySection: new Map(),
      avgBySection: new Map(),
      fastestVehicleBySection: new Map()
    };

    await generateSectionReport(analysis, testOutputPath);
    
    expect(existsSync(testOutputPath)).toBe(true);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('# Section Analysis Report');
  });
});
