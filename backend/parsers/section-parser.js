import { parseCSV } from './base-parser.js';

/**
 * Parse section analysis CSV files
 * @param {string} filePath - Path to section analysis CSV file
 * @returns {Promise<Array<Object>>} Array of section analysis records
 */
export async function parseSections(filePath) {
  const records = await parseCSV(filePath, ';');
  
  return records.map(record => ({
    number: parseInt(record.NUMBER, 10),
    lap_number: parseInt(record.LAP_NUMBER, 10),
    lap_time: record.LAP_TIME,
    s1: record.S1,
    s2: record.S2,
    s3: record.S3,
    top_speed: parseFloat(record.TOP_SPEED)
  }));
}
