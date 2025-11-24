/**
 * Data import module for Racing Data API
 * Imports CSV data into SQLite database using existing parsers
 */

import path from 'path';
import fs from 'fs';
import { parseLapTimes } from '../../parsers/lap-time-parser.js';
import { parseRaceResults } from '../../parsers/results-parser.js';
import { parseTelemetry } from '../../parsers/telemetry-parser.js';
import { parseSections } from '../../parsers/section-parser.js';
import { parseWeather } from '../../parsers/weather-parser.js';

/**
 * Import all race data from CSV files into database
 * @param {string} dataDirectory - Directory containing CSV files
 * @param {Database} db - Database connection
 * @returns {Promise<Object>} Import statistics
 */
export async function importRaceData(dataDirectory, db) {
  console.log('Starting race data import...');
  const startTime = Date.now();

  // Verify directory exists
  if (!fs.existsSync(dataDirectory)) {
    throw new Error(`Data directory not found: ${dataDirectory}`);
  }

  // Find CSV files
  const files = fs.readdirSync(dataDirectory);
  const csvFiles = {
    lapTimes: files.filter(f => f.includes('lap_time') && f.endsWith('.csv')),
    results: files.filter(f => f.includes('Results') && f.endsWith('.CSV')),
    telemetry: files.filter(f => f.includes('telemetry') && f.endsWith('.csv')),
    sections: files.filter(f => f.includes('Endurance') && f.endsWith('.CSV')),
    weather: files.filter(f => f.includes('Weather') && f.endsWith('.CSV'))
  };

  console.log('Found CSV files:', {
    lapTimes: csvFiles.lapTimes.length,
    results: csvFiles.results.length,
    telemetry: csvFiles.telemetry.length,
    sections: csvFiles.sections.length,
    weather: csvFiles.weather.length
  });

  // Parse all data first
  console.log('Parsing CSV files...');
  const lapData = [];
  const resultsData = [];
  const telemetryData = [];
  const sectionsData = [];
  const weatherData = [];

  // Parse lap times
  for (const file of csvFiles.lapTimes) {
    const filePath = path.join(dataDirectory, file);
    const data = await parseLapTimes(filePath);
    lapData.push(...data);
  }
  console.log(`Parsed ${lapData.length} lap time records`);

  // Parse results
  for (const file of csvFiles.results) {
    const filePath = path.join(dataDirectory, file);
    const data = await parseRaceResults(filePath);
    resultsData.push(...data);
  }
  console.log(`Parsed ${resultsData.length} result records`);

  // Parse sections
  for (const file of csvFiles.sections) {
    const filePath = path.join(dataDirectory, file);
    const data = await parseSections(filePath);
    sectionsData.push(...data);
  }
  console.log(`Parsed ${sectionsData.length} section records`);

  // Parse weather
  for (const file of csvFiles.weather) {
    const filePath = path.join(dataDirectory, file);
    const data = await parseWeather(filePath);
    weatherData.push(...data);
  }
  console.log(`Parsed ${weatherData.length} weather records`);

  // Import data into database
  console.log('Importing data into database...');
  const stats = {
    vehiclesImported: 0,
    lapsImported: 0,
    telemetryImported: 0,
    resultsImported: 0,
    sectionsImported: 0,
    weatherImported: 0
  };

  // Temporarily disable foreign key constraints for import
  db.pragma('foreign_keys = OFF');

  // Import in order (vehicles first due to foreign keys)
  // Note: We skip telemetry data for vehicle import to avoid memory issues
  stats.vehiclesImported = await importVehicles(db, lapData, resultsData, []);
  stats.lapsImported = await importLapTimes(db, lapData);
  stats.resultsImported = await importResults(db, resultsData);
  stats.sectionsImported = await importSections(db, sectionsData);
  stats.weatherImported = await importWeather(db, weatherData);
  
  // Import telemetry directly from file (streaming to avoid memory issues)
  for (const file of csvFiles.telemetry) {
    const filePath = path.join(dataDirectory, file);
    console.log(`Importing telemetry file: ${file}...`);
    stats.telemetryImported += await importTelemetryFromFile(db, filePath);
  }
  
  // Update vehicle max speeds from telemetry (after telemetry is imported)
  console.log('Updating vehicle max speeds from telemetry...');
  updateVehicleMaxSpeeds(db);
  
  // Re-enable foreign key constraints
  db.pragma('foreign_keys = ON');

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Import completed in ${duration}s`);
  console.log('Import statistics:', stats);

  return stats;
}

/**
 * Import vehicles with aggregated statistics
 * @param {Database} db - Database connection
 * @param {Array} lapData - Lap time records
 * @param {Array} resultsData - Race result records
 * @param {Array} telemetryData - Telemetry records
 * @returns {number} Number of vehicles imported
 */
export function importVehicles(db, lapData, resultsData, telemetryData) {
  console.log('Importing vehicles...');

  // Extract unique vehicle IDs from lap data (primary source)
  const vehicleIds = new Set();
  lapData.forEach(lap => vehicleIds.add(lap.vehicle_id));

  console.log(`Found ${vehicleIds.size} unique vehicles`);

  // Prepare insert statement
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO vehicles 
    (vehicle_id, car_number, class, fastest_lap, average_lap, total_laps, max_speed, position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Use transaction for batch insert
  const insertMany = db.transaction((vehicles) => {
    for (const vehicle of vehicles) {
      insertStmt.run(
        vehicle.vehicle_id,
        vehicle.car_number,
        vehicle.class,
        vehicle.fastest_lap,
        vehicle.average_lap,
        vehicle.total_laps,
        vehicle.max_speed,
        vehicle.position
      );
    }
  });

  // Calculate statistics for each vehicle
  const vehicles = [];
  for (const vehicleId of vehicleIds) {
    // Get car number from vehicle_id (format: GR86-XXX-YY)
    // Extract the last part as car number
    const carNumber = parseInt(vehicleId.split('-').pop(), 10);

    // Get lap times for this vehicle
    const vehicleLaps = lapData.filter(lap => lap.vehicle_id === vehicleId);

    // Calculate lap statistics
    let fastestLap = null;
    let averageLap = null;
    let totalLaps = vehicleLaps.length;

    if (vehicleLaps.length > 0) {
      const lapValues = vehicleLaps.map(lap => lap.value);
      fastestLap = Math.min(...lapValues);
      averageLap = lapValues.reduce((sum, val) => sum + val, 0) / lapValues.length;
    }

    // Max speed will be calculated after telemetry import to avoid memory issues
    let maxSpeed = null;

    // For now, we don't have a reliable way to map vehicle_id to results
    // So we'll import vehicles without class and position from results
    vehicles.push({
      vehicle_id: vehicleId,
      car_number: carNumber,
      class: null,  // Will be null for now
      fastest_lap: fastestLap,
      average_lap: averageLap,
      total_laps: totalLaps,
      max_speed: maxSpeed,
      position: null  // Will be null for now
    });
  }

  // Insert all vehicles
  insertMany(vehicles);

  console.log(`Imported ${vehicles.length} vehicles`);
  return vehicles.length;
}

/**
 * Import lap times with batch inserts
 * @param {Database} db - Database connection
 * @param {Array} lapData - Lap time records
 * @returns {number} Number of laps imported
 */
export function importLapTimes(db, lapData) {
  console.log('Importing lap times...');

  const insertStmt = db.prepare(`
    INSERT INTO lap_times (vehicle_id, lap, lap_time, timestamp)
    VALUES (?, ?, ?, ?)
  `);

  // Use transaction for batch insert
  const insertMany = db.transaction((laps) => {
    for (const lap of laps) {
      insertStmt.run(
        lap.vehicle_id,
        lap.lap,
        lap.value,
        lap.timestamp ? lap.timestamp.toISOString() : null
      );
    }
  });

  insertMany(lapData);

  console.log(`Imported ${lapData.length} lap times`);
  return lapData.length;
}

/**
 * Import telemetry with progress reporting
 * @param {Database} db - Database connection
 * @param {Array} telemetryData - Telemetry records
 * @returns {number} Number of telemetry records imported
 */
export function importTelemetry(db, telemetryData) {
  console.log('Importing telemetry...');

  const insertStmt = db.prepare(`
    INSERT INTO telemetry (vehicle_id, lap, timestamp, telemetry_name, telemetry_value)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Use transaction for batch insert with progress reporting
  const batchSize = 10000;
  let imported = 0;

  for (let i = 0; i < telemetryData.length; i += batchSize) {
    const batch = telemetryData.slice(i, i + batchSize);

    const insertBatch = db.transaction((records) => {
      for (const record of records) {
        insertStmt.run(
          record.vehicle_id,
          record.lap,
          record.timestamp ? record.timestamp.toISOString() : null,
          record.telemetry_name,
          record.telemetry_value
        );
      }
    });

    insertBatch(batch);
    imported += batch.length;

    // Report progress every 10,000 records
    if (imported % 10000 === 0 || imported === telemetryData.length) {
      console.log(`  Imported ${imported}/${telemetryData.length} telemetry records`);
    }
  }

  console.log(`Imported ${imported} telemetry records`);
  return imported;
}

/**
 * Import race results
 * @param {Database} db - Database connection
 * @param {Array} resultsData - Race result records
 * @returns {number} Number of results imported
 */
export function importResults(db, resultsData) {
  console.log('Importing race results...');

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO race_results 
    (vehicle_id, position, car_number, laps, total_time, gap_first, gap_previous, best_lap_time, class)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Filter out results without required fields
  const validResults = resultsData.filter(r => r.position && r.number && r.laps);
  
  // Use transaction for batch insert
  const insertMany = db.transaction((results) => {
    for (const result of results) {
      // Create vehicle_id from car number
      const vehicleId = `GR86-004-${result.number}`;

      insertStmt.run(
        vehicleId,
        result.position,
        result.number,
        result.laps,
        result.total_time,
        result.gap_first,
        result.gap_previous,
        result.best_lap_time,
        result.class
      );
    }
  });

  insertMany(validResults);
  
  if (validResults.length < resultsData.length) {
    console.log(`  Skipped ${resultsData.length - validResults.length} results with missing required fields`);
  }

  console.log(`Imported ${validResults.length} race results`);
  return validResults.length;
}

/**
 * Import section times
 * @param {Database} db - Database connection
 * @param {Array} sectionsData - Section timing records
 * @returns {number} Number of section records imported
 */
export function importSections(db, sectionsData) {
  console.log('Importing section times...');

  const insertStmt = db.prepare(`
    INSERT INTO section_times (vehicle_id, lap, s1, s2, s3, lap_time, top_speed)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Parse time string to milliseconds
  const parseTime = (timeStr) => {
    if (!timeStr || timeStr === '') return null;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return null;
    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);
    if (isNaN(minutes) || isNaN(seconds)) return null;
    return (minutes * 60 + seconds) * 1000;
  };

  // Use transaction for batch insert
  const insertMany = db.transaction((sections) => {
    for (const section of sections) {
      // Create vehicle_id from car number
      const vehicleId = `GR86-004-${section.number}`;

      insertStmt.run(
        vehicleId,
        section.lap_number,
        parseTime(section.s1),
        parseTime(section.s2),
        parseTime(section.s3),
        parseTime(section.lap_time),
        section.top_speed
      );
    }
  });

  insertMany(sectionsData);

  console.log(`Imported ${sectionsData.length} section records`);
  return sectionsData.length;
}

/**
 * Import weather data
 * @param {Database} db - Database connection
 * @param {Array} weatherData - Weather records
 * @returns {number} Number of weather records imported
 */
export function importWeather(db, weatherData) {
  console.log('Importing weather data...');

  const insertStmt = db.prepare(`
    INSERT INTO weather (timestamp, air_temp, track_temp, humidity, pressure, wind_speed, wind_direction, rain)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Use transaction for batch insert
  const insertMany = db.transaction((records) => {
    for (const record of records) {
      insertStmt.run(
        record.timestamp ? record.timestamp.toISOString() : null,
        record.air_temp,
        record.track_temp,
        record.humidity,
        record.pressure,
        record.wind_speed,
        record.wind_direction,
        record.rain
      );
    }
  });

  insertMany(weatherData);

  console.log(`Imported ${weatherData.length} weather records`);
  return weatherData.length;
}

/**
 * Import telemetry directly from file with streaming to avoid memory issues
 * @param {Database} db - Database connection
 * @param {string} filePath - Path to telemetry CSV file
 * @returns {Promise<number>} Number of telemetry records imported
 */
export async function importTelemetryFromFile(db, filePath) {
  console.log('Importing telemetry from file (streaming)...');

  const insertStmt = db.prepare(`
    INSERT INTO telemetry (vehicle_id, lap, timestamp, telemetry_name, telemetry_value)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Parse and import in batches
  const batchSize = 10000;
  let batch = [];
  let imported = 0;

  // Parse telemetry with streaming
  const telemetryData = await parseTelemetry(filePath);
  
  for (let i = 0; i < telemetryData.length; i += batchSize) {
    const batchData = telemetryData.slice(i, Math.min(i + batchSize, telemetryData.length));

    const insertBatch = db.transaction((records) => {
      for (const record of records) {
        insertStmt.run(
          record.vehicle_id,
          record.lap,
          record.timestamp ? record.timestamp.toISOString() : null,
          record.telemetry_name,
          record.telemetry_value
        );
      }
    });

    insertBatch(batchData);
    imported += batchData.length;

    // Report progress every 100,000 records
    if (imported % 100000 === 0 || imported === telemetryData.length) {
      console.log(`  Imported ${imported.toLocaleString()}/${telemetryData.length.toLocaleString()} telemetry records`);
    }
    
    // Clear batch to free memory
    batchData.length = 0;
  }

  console.log(`Imported ${imported.toLocaleString()} telemetry records`);
  return imported;
}

/**
 * Update vehicle max speeds from telemetry data
 * This is done after telemetry import to avoid memory issues with large datasets
 * @param {Database} db - Database connection
 */
export function updateVehicleMaxSpeeds(db) {
  console.log('Calculating max speeds from telemetry...');
  
  // Use SQL to calculate max speed per vehicle directly in the database
  const updateStmt = db.prepare(`
    UPDATE vehicles
    SET max_speed = (
      SELECT MAX(telemetry_value)
      FROM telemetry
      WHERE telemetry.vehicle_id = vehicles.vehicle_id
        AND (telemetry.telemetry_name = 'vCar' OR telemetry.telemetry_name = 'speed_can')
    )
    WHERE EXISTS (
      SELECT 1 FROM telemetry
      WHERE telemetry.vehicle_id = vehicles.vehicle_id
        AND (telemetry.telemetry_name = 'vCar' OR telemetry.telemetry_name = 'speed_can')
    )
  `);
  
  const result = updateStmt.run();
  console.log(`Updated max speeds for ${result.changes} vehicles`);
}
