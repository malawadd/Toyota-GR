import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseCSV } from '../parsers/base-parser.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a CSV string from data and delimiter
 */
function generateCSV(data, delimiter) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(delimiter);
  const dataRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape values containing delimiter or quotes
      if (typeof value === 'string' && (value.includes(delimiter) || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(delimiter)
  );
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Write CSV content to a temporary file
 */
async function writeTempCSV(content, filename) {
  const tempPath = path.join(__dirname, filename);
  await fs.writeFile(tempPath, content, 'utf-8');
  return tempPath;
}

/**
 * Delete temporary file
 */
async function deleteTempFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore errors if file doesn't exist
  }
}

describe('Base CSV Parser', () => {
  // **Feature: racing-data-explorer, Property 1: CSV delimiter parsing**
  // **Validates: Requirements 1.1, 1.2**
  test('Property 1: CSV parsing works for any delimiter (comma or semicolon)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            vehicle_id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('"')),
            lap: fc.integer({ min: 1, max: 100 }),
            value: fc.integer({ min: 60000, max: 300000 }),
            timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
              .map(d => d.toISOString())
          }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.constantFrom(',', ';'),
        async (data, delimiter) => {
          const csv = generateCSV(data, delimiter);
          const tempFile = await writeTempCSV(csv, `test-${delimiter === ',' ? 'comma' : 'semicolon'}-${Date.now()}.csv`);
          
          try {
            const parsed = await parseCSV(tempFile, delimiter);
            
            // Verify all records were parsed
            expect(parsed.length).toBe(data.length);
            
            // Verify all fields are accessible
            for (let i = 0; i < data.length; i++) {
              expect(parsed[i]).toHaveProperty('vehicle_id');
              expect(parsed[i]).toHaveProperty('lap');
              expect(parsed[i]).toHaveProperty('value');
              expect(parsed[i]).toHaveProperty('timestamp');
              
              // Verify values match (as strings, since we don't do type conversion yet)
              expect(parsed[i].vehicle_id).toBe(data[i].vehicle_id);
              expect(parsed[i].lap).toBe(String(data[i].lap));
              expect(parsed[i].value).toBe(String(data[i].value));
              expect(parsed[i].timestamp).toBe(data[i].timestamp);
            }
            
            return true;
          } finally {
            await deleteTempFile(tempFile);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
