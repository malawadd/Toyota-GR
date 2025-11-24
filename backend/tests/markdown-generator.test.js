import { describe, it, expect } from 'vitest';
import { createTable, createHeading, formatNumber, formatLapTime } from '../reporters/markdown-generator.js';

describe('Markdown Generator', () => {
  describe('createTable', () => {
    it('should create a markdown table with headers and rows', () => {
      const headers = ['Position', 'Driver', 'Time'];
      const rows = [
        ['1', 'Driver A', '2:30.123'],
        ['2', 'Driver B', '2:31.456']
      ];
      
      const result = createTable(headers, rows);
      
      expect(result).toContain('| Position | Driver | Time |');
      expect(result).toContain('| --- | --- | --- |');
      expect(result).toContain('| 1 | Driver A | 2:30.123 |');
      expect(result).toContain('| 2 | Driver B | 2:31.456 |');
    });

    it('should handle empty rows', () => {
      const headers = ['Col1', 'Col2'];
      const rows = [];
      
      const result = createTable(headers, rows);
      
      expect(result).toContain('| Col1 | Col2 |');
      expect(result).toContain('| --- | --- |');
    });

    it('should handle empty headers', () => {
      const headers = [];
      const rows = [['data']];
      
      const result = createTable(headers, rows);
      
      expect(result).toBe('');
    });

    it('should handle single column', () => {
      const headers = ['Name'];
      const rows = [['Alice'], ['Bob']];
      
      const result = createTable(headers, rows);
      
      expect(result).toContain('| Name |');
      expect(result).toContain('| --- |');
      expect(result).toContain('| Alice |');
      expect(result).toContain('| Bob |');
    });
  });

  describe('createHeading', () => {
    it('should create level 1 heading', () => {
      const result = createHeading('Title', 1);
      expect(result).toBe('# Title');
    });

    it('should create level 2 heading', () => {
      const result = createHeading('Subtitle', 2);
      expect(result).toBe('## Subtitle');
    });

    it('should create level 3 heading', () => {
      const result = createHeading('Section', 3);
      expect(result).toBe('### Section');
    });

    it('should default to level 1 if no level specified', () => {
      const result = createHeading('Default');
      expect(result).toBe('# Default');
    });

    it('should clamp level to valid range (1-6)', () => {
      const result1 = createHeading('Too Low', 0);
      expect(result1).toBe('# Too Low');
      
      const result2 = createHeading('Too High', 10);
      expect(result2).toBe('# Too High');
    });

    it('should create level 6 heading', () => {
      const result = createHeading('Deep', 6);
      expect(result).toBe('###### Deep');
    });
  });

  describe('formatNumber', () => {
    it('should format number with default 2 decimal places', () => {
      const result = formatNumber(123.456);
      expect(result).toBe('123.46');
    });

    it('should format number with specified precision', () => {
      const result = formatNumber(123.456789, 3);
      expect(result).toBe('123.457');
    });

    it('should format number with 0 decimal places', () => {
      const result = formatNumber(123.456, 0);
      expect(result).toBe('123');
    });

    it('should handle null values', () => {
      const result = formatNumber(null);
      expect(result).toBe('N/A');
    });

    it('should handle undefined values', () => {
      const result = formatNumber(undefined);
      expect(result).toBe('N/A');
    });

    it('should handle NaN values', () => {
      const result = formatNumber(NaN);
      expect(result).toBe('N/A');
    });

    it('should format integers correctly', () => {
      const result = formatNumber(100, 2);
      expect(result).toBe('100.00');
    });
  });

  describe('formatLapTime', () => {
    it('should format lap time in MM:SS.mmm format', () => {
      // 2 minutes 30.123 seconds = 150123 ms
      const result = formatLapTime(150123);
      expect(result).toBe('2:30.123');
    });

    it('should pad seconds with leading zero', () => {
      // 2 minutes 8.630 seconds = 128630 ms
      const result = formatLapTime(128630);
      expect(result).toBe('2:08.630');
    });

    it('should handle times under 1 minute', () => {
      // 45.678 seconds = 45678 ms
      const result = formatLapTime(45678);
      expect(result).toBe('0:45.678');
    });

    it('should handle times over 10 minutes', () => {
      // 12 minutes 34.567 seconds = 754567 ms
      const result = formatLapTime(754567);
      expect(result).toBe('12:34.567');
    });

    it('should handle null values', () => {
      const result = formatLapTime(null);
      expect(result).toBe('N/A');
    });

    it('should handle undefined values', () => {
      const result = formatLapTime(undefined);
      expect(result).toBe('N/A');
    });

    it('should handle NaN values', () => {
      const result = formatLapTime(NaN);
      expect(result).toBe('N/A');
    });

    it('should handle zero', () => {
      const result = formatLapTime(0);
      expect(result).toBe('0:00.000');
    });

    it('should format milliseconds correctly', () => {
      // 1.001 seconds = 1001 ms
      const result = formatLapTime(1001);
      expect(result).toBe('0:01.001');
    });
  });
});
