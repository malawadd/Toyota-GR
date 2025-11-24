import { describe, it, expect, afterEach } from 'vitest';
import { generateResultsReport } from '../reporters/results-report.js';
import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';

describe('Results Report Generator', () => {
  const testOutputPath = 'test-results-report.md';
  
  afterEach(async () => {
    if (existsSync(testOutputPath)) {
      await unlink(testOutputPath);
    }
  });

  it('should generate a markdown report with race results', async () => {
    const resultRecords = [
      {
        position: 1,
        number: 46,
        laps: 17,
        total_time: '46:00.172',
        gap_first: '',
        gap_previous: '',
        best_lap_time: '2:28.745',
        class: 'Am'
      },
      {
        position: 2,
        number: 7,
        laps: 17,
        total_time: '46:07.379',
        gap_first: '7.207',
        gap_previous: '7.207',
        best_lap_time: '2:30.363',
        class: 'Am'
      }
    ];

    const analysis = {
      winner: resultRecords[0],
      totalVehicles: 2,
      gaps: [],
      byClass: new Map([['Am', resultRecords]])
    };

    await generateResultsReport(analysis, resultRecords, testOutputPath);
    
    expect(existsSync(testOutputPath)).toBe(true);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('# Race Results Report');
    expect(content).toContain('## Race Winner');
    expect(content).toContain('🏆 **Winner: Car #46**');
    expect(content).toContain('## Overall Statistics');
    expect(content).toContain('**Total Vehicles**: 2');
    expect(content).toContain('## Results by Class');
    expect(content).toContain('### Class: Am');
    expect(content).toContain('## Complete Results');
  });

  it('should highlight the winner', async () => {
    const resultRecords = [
      {
        position: 1,
        number: 46,
        laps: 17,
        total_time: '46:00.172',
        gap_first: '',
        gap_previous: '',
        best_lap_time: '2:28.745',
        class: 'Am'
      }
    ];

    const analysis = {
      winner: resultRecords[0],
      totalVehicles: 1,
      gaps: [],
      byClass: new Map([['Am', resultRecords]])
    };

    await generateResultsReport(analysis, resultRecords, testOutputPath);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('🏆 **Winner: Car #46**');
    expect(content).toContain('Laps Completed: 17');
    expect(content).toContain('Best Lap: 2:28.745');
  });

  it('should handle multiple classes', async () => {
    const amResults = [
      {
        position: 1,
        number: 46,
        laps: 17,
        total_time: '46:00.172',
        gap_first: '',
        gap_previous: '',
        best_lap_time: '2:28.745',
        class: 'Am'
      }
    ];

    const proResults = [
      {
        position: 2,
        number: 7,
        laps: 17,
        total_time: '46:07.379',
        gap_first: '7.207',
        gap_previous: '7.207',
        best_lap_time: '2:30.363',
        class: 'Pro'
      }
    ];

    const analysis = {
      winner: amResults[0],
      totalVehicles: 2,
      gaps: [],
      byClass: new Map([
        ['Am', amResults],
        ['Pro', proResults]
      ])
    };

    await generateResultsReport(analysis, [...amResults, ...proResults], testOutputPath);
    
    const content = await readFile(testOutputPath, 'utf-8');
    
    expect(content).toContain('### Class: Am');
    expect(content).toContain('### Class: Pro');
  });
});
