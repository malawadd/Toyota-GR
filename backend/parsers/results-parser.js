import { parseCSV } from './base-parser.js';

/**
 * Parse race results CSV files
 * @param {string} filePath - Path to race results CSV file
 * @returns {Promise<Array<Object>>} Array of race result records
 */
export async function parseRaceResults(filePath) {
  const records = await parseCSV(filePath, ';');
  
  return records.map(record => ({
    position: parseInt(record.POSITION, 10),
    number: parseInt(record.NUMBER, 10),
    laps: parseInt(record.LAPS, 10),
    total_time: record.TOTAL_TIME,
    gap_first: record.GAP_FIRST,
    gap_previous: record.GAP_PREVIOUS,
    best_lap_time: record.FL_TIME,
    class: record.CLASS
  }));
}
