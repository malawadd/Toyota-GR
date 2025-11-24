import fs from 'fs';
import { promises as fsPromises } from 'fs';
import Papa from 'papaparse';
import csvParser from 'csv-parser';

/**
 * Parse CSV file into memory (for smaller files)
 * @param {string} filePath - Path to CSV file
 * @param {string} delimiter - Delimiter character (',' or ';')
 * @returns {Promise<Array<Object>>} Array of parsed records
 */
export async function parseCSV(filePath, delimiter = ',') {
  console.log(`[Parser] Starting to parse file: ${filePath}`);
  
  try {
    const fileContent = await fsPromises.readFile(filePath, 'utf-8');
    
    const result = Papa.parse(fileContent, {
      header: true,
      delimiter: delimiter,
      skipEmptyLines: true,
      dynamicTyping: false, // We'll handle type conversion separately
      transformHeader: (header) => header.trim()
    });

    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        console.error(`[Parser] CSV parsing error in ${filePath} at row ${error.row}: ${error.message}`);
      });
    }

    console.log(`[Parser] Successfully parsed ${result.data.length} records from ${filePath}`);
    return result.data;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`[Parser] File not found: ${filePath}`);
    } else {
      console.error(`[Parser] Error reading file ${filePath}:`, error.message);
    }
    throw error;
  }
}

/**
 * Parse CSV file using streaming (for large files)
 * @param {string} filePath - Path to CSV file
 * @param {string} delimiter - Delimiter character (',' or ';')
 * @param {Function} onChunk - Callback function called with each chunk of records
 * @param {number} chunkSize - Number of records per chunk (default: 1000)
 * @returns {Promise<{recordCount: number}>} Total number of records processed
 */
export async function parseCSVStream(filePath, delimiter = ',', onChunk, chunkSize = 1000) {
  console.log(`[Parser] Starting to stream parse file: ${filePath}`);
  
  return new Promise((resolve, reject) => {
    let recordCount = 0;
    let chunk = [];
    let errorCount = 0;

    const stream = fs.createReadStream(filePath)
      .pipe(csvParser({
        separator: delimiter,
        mapHeaders: ({ header }) => header.trim()
      }));

    stream.on('data', (record) => {
      try {
        chunk.push(record);
        recordCount++;

        if (chunk.length >= chunkSize) {
          onChunk(chunk);
          chunk = [];
        }
      } catch (error) {
        errorCount++;
        console.error(`[Parser] Error processing record ${recordCount} in ${filePath}:`, error.message);
      }
    });

    stream.on('end', () => {
      // Process remaining records in the last chunk
      if (chunk.length > 0) {
        onChunk(chunk);
      }
      console.log(`[Parser] Successfully streamed ${recordCount} records from ${filePath} (${errorCount} errors)`);
      resolve({ recordCount });
    });

    stream.on('error', (error) => {
      if (error.code === 'ENOENT') {
        console.error(`[Parser] File not found: ${filePath}`);
      } else {
        console.error(`[Parser] Error streaming file ${filePath}:`, error.message);
      }
      reject(error);
    });
  });
}
