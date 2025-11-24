import { parseCSV, parseCSVStream } from './base-parser.js';
import { promises as fsPromises } from 'fs';

const FILE_SIZE_THRESHOLD = 50 * 1024 * 1024; // 50MB

/**
 * Parse telemetry CSV files with automatic streaming for large files
 * @param {string} filePath - Path to telemetry CSV file
 * @param {Function} onChunk - Optional callback for streaming mode
 * @returns {Promise<Array<Object>|{recordCount: number}>} Array of telemetry records or stream result
 */
export async function parseTelemetry(filePath, onChunk = null) {
  // Check file size
  const stats = await fsPromises.stat(filePath);
  const useStreaming = stats.size > FILE_SIZE_THRESHOLD;
  
  if (useStreaming) {
    // Use streaming for large files
    if (!onChunk) {
      // If no callback provided, collect all records in memory (not recommended for very large files)
      const allRecords = [];
      await parseCSVStream(filePath, ',', (records) => {
        const transformed = records.map(transformTelemetryRecord);
        allRecords.push(...transformed);
      });
      return allRecords;
    } else {
      return await parseCSVStream(filePath, ',', (records) => {
        const transformed = records.map(transformTelemetryRecord);
        onChunk(transformed);
      });
    }
  } else {
    // Use in-memory parsing for smaller files
    const records = await parseCSV(filePath, ',');
    return records.map(transformTelemetryRecord);
  }
}

/**
 * Transform raw telemetry record to structured format
 * @param {Object} record - Raw CSV record
 * @returns {Object} Transformed telemetry record
 */
function transformTelemetryRecord(record) {
  return {
    vehicle_id: record.vehicle_id,
    timestamp: new Date(record.timestamp),
    telemetry_name: record.telemetry_name,
    telemetry_value: parseFloat(record.telemetry_value),
    lap: parseInt(record.lap, 10)
  };
}
