import { parseCSV } from './base-parser.js';

/**
 * Parse lap timing CSV files
 * @param {string} filePath - Path to lap timing CSV file
 * @returns {Promise<Array<Object>>} Array of lap time records
 */
export async function parseLapTimes(filePath) {
  const records = await parseCSV(filePath, ',');
  
  return records.map(record => ({
    vehicle_id: record.vehicle_id,
    lap: parseInt(record.lap, 10),
    value: parseInt(record.value, 10), // milliseconds
    timestamp: new Date(record.timestamp)
  }));
}
