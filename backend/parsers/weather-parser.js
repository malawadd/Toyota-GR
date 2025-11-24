import { parseCSV } from './base-parser.js';

/**
 * Parse weather CSV files
 * @param {string} filePath - Path to weather CSV file
 * @returns {Promise<Array<Object>>} Array of weather records
 */
export async function parseWeather(filePath) {
  const records = await parseCSV(filePath, ';');
  
  return records.map(record => ({
    timestamp: new Date(parseInt(record.TIME_UTC_SECONDS, 10) * 1000),
    air_temp: parseFloat(record.AIR_TEMP),
    track_temp: parseFloat(record.TRACK_TEMP),
    humidity: parseFloat(record.HUMIDITY),
    pressure: parseFloat(record.PRESSURE),
    wind_speed: parseFloat(record.WIND_SPEED),
    wind_direction: parseFloat(record.WIND_DIRECTION),
    rain: parseFloat(record.RAIN)
  }));
}
