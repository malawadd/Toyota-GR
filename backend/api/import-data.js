#!/usr/bin/env node

/**
 * CLI script for importing race data into the database
 * Usage: node import-data.js <data-directory> [options]
 */

import { initializeDatabase, closeDatabase } from './database/init.js';
import { importRaceData } from './database/import.js';
import path from 'path';
import fs from 'fs';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  const options = {
    dataDirectory: null,
    dbPath: process.env.DB_PATH || './data/racing.db',
    verbose: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '-v' || arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--db' || arg === '--database') {
      options.dbPath = args[++i];
    } else if (!options.dataDirectory) {
      options.dataDirectory = arg;
    }
  }

  return options;
}

// Display help message
function showHelp() {
  console.log(`
Racing Data Import CLI

Usage: node import-data.js <data-directory> [options]

Arguments:
  <data-directory>    Path to directory containing CSV files (required)

Options:
  --db, --database    Path to SQLite database file (default: ./data/racing.db)
  -v, --verbose       Enable verbose logging
  -h, --help          Show this help message

Environment Variables:
  DB_PATH            Database file path (overridden by --db option)

Examples:
  node import-data.js ../data
  node import-data.js ../data --db ./racing.db
  node import-data.js ../data --verbose
  DB_PATH=./custom.db node import-data.js ../data

CSV Files Expected:
  - Lap times: *lap_time*.csv
  - Results: *Results*.CSV
  - Telemetry: *telemetry*.csv
  - Sections: *Endurance*.CSV
  - Weather: *Weather*.CSV
`);
}

// Validate data directory
function validateDataDirectory(dataDirectory) {
  if (!dataDirectory) {
    console.error('Error: Data directory is required');
    console.error('Run with --help for usage information');
    return false;
  }

  if (!fs.existsSync(dataDirectory)) {
    console.error(`Error: Data directory not found: ${dataDirectory}`);
    return false;
  }

  if (!fs.statSync(dataDirectory).isDirectory()) {
    console.error(`Error: Path is not a directory: ${dataDirectory}`);
    return false;
  }

  return true;
}

// Main import function
async function main() {
  const options = parseArgs();

  // Show help if requested
  if (options.help) {
    showHelp();
    process.exit(0);
  }

  // Validate data directory
  if (!validateDataDirectory(options.dataDirectory)) {
    process.exit(1);
  }

  // Resolve paths
  const dataDirectory = path.resolve(options.dataDirectory);
  const dbPath = path.resolve(options.dbPath);

  console.log('='.repeat(60));
  console.log('Racing Data Import');
  console.log('='.repeat(60));
  console.log(`Data directory: ${dataDirectory}`);
  console.log(`Database path:  ${dbPath}`);
  console.log('='.repeat(60));
  console.log();

  let db = null;

  try {
    // Initialize database
    console.log('Initializing database...');
    db = initializeDatabase(dbPath, { verbose: options.verbose });
    console.log('✓ Database initialized successfully');
    console.log();

    // Import data
    const stats = await importRaceData(dataDirectory, db);

    // Display summary
    console.log();
    console.log('='.repeat(60));
    console.log('Import Summary');
    console.log('='.repeat(60));
    console.log(`Vehicles:   ${stats.vehiclesImported.toLocaleString()}`);
    console.log(`Lap times:  ${stats.lapsImported.toLocaleString()}`);
    console.log(`Telemetry:  ${stats.telemetryImported.toLocaleString()}`);
    console.log(`Results:    ${stats.resultsImported.toLocaleString()}`);
    console.log(`Sections:   ${stats.sectionsImported.toLocaleString()}`);
    console.log(`Weather:    ${stats.weatherImported.toLocaleString()}`);
    console.log('='.repeat(60));
    console.log();
    console.log('✓ Import completed successfully!');
    console.log();

    // Close database
    closeDatabase(db);
    process.exit(0);

  } catch (error) {
    console.error();
    console.error('='.repeat(60));
    console.error('Import Failed');
    console.error('='.repeat(60));
    console.error(`Error: ${error.message}`);
    
    if (options.verbose && error.stack) {
      console.error();
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    console.error('='.repeat(60));
    console.error();

    // Clean up
    if (db) {
      try {
        closeDatabase(db);
      } catch (closeError) {
        console.error(`Warning: Failed to close database: ${closeError.message}`);
      }
    }

    process.exit(1);
  }
}

// Run the script
main();
