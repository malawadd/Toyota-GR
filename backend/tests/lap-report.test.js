import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateLapReport } from '../reporters/lap-report.js';
import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';

describe('Lap Report Generator', () => {
  const testOutputPath = 'test-lap-report.md';
  
  afterEach(async () => {
    // Clean up test file
    if (existsSync(testOutputPath)) {
      await unlink(testOutputPath);
    }
  });

  it('should generate a markdown report with lap statistics', async () => {
    const analysis = {
      fastest: 88000,
      average: 90000,
      stdDev: 2000,
      rankings: [
        {
          rank: 1,
          vehicle: 'GR86-001',
          fastest: 88000,
          average: 89000,
          stdDev: 1500,
          lapCount: 10,
          consistency: 0.0168
        },
        {
          rank: 2,
          vehicle: 'GR86-002',
          fastest: 89000,
          average: 91000,
          stdDev: 2500,
          lapCount: 10,
          consistency: 0.0275
        }
      ]
    };

    await generateLapReport(analysis, testOutputPath);
    
    // Verify file was created
    expect(existsSync(testOutputPath)).toBe(true);
    
    // Read and verify content
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('# Lap Time Analysis Report');
    expect(content).toContain('## Overall Statistics');
    expect(content).toContain('**Fastest Lap**: 1:28.000');
    expect(content).toContain('**Average Lap**: 1:30.000');
    expect(content).toContain('## Vehicle Rankings');
    expect(content).toContain('| Rank | Vehicle | Fastest Lap | Average Lap | Std Dev | Lap Count | Consistency |');
    expect(content).toContain('| 1 | GR86-001 | 1:28.000 | 1:29.000 | 1.500s | 10 | 1.68% |');
    expect(content).toContain('| 2 | GR86-002 | 1:29.000 | 1:31.000 | 2.500s | 10 | 2.75% |');
  });

  it('should handle empty rankings', async () => {
    const analysis = {
      fastest: 88000,
      average: 90000,
      stdDev: 2000,
      rankings: []
    };

    await generateLapReport(analysis, testOutputPath);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('# Lap Time Analysis Report');
    expect(content).toContain('## Overall Statistics');
    expect(content).not.toContain('## Vehicle Rankings');
  });

  it('should create file with .md extension', async () => {
    const analysis = {
      fastest: 88000,
      average: 90000,
      stdDev: 2000,
      rankings: []
    };

    await generateLapReport(analysis, testOutputPath);
    
    expect(testOutputPath.endsWith('.md')).toBe(true);
    expect(existsSync(testOutputPath)).toBe(true);
  });
});
