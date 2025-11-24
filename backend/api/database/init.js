/**
 * Database initialization module
 * Handles database creation, table setup, and schema versioning
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { CREATE_TABLES, CREATE_INDEXES, CURRENT_SCHEMA_VERSION } from './schema.js';

/**
 * Initialize database with all tables and indexes
 * @param {string} dbPath - Path to SQLite database file
 * @param {Object} options - Configuration options
 * @param {boolean} options.verbose - Enable verbose logging
 * @param {boolean} options.memory - Use in-memory database (for testing)
 * @returns {Database} - Database connection object
 * @throws {Error} - If database initialization fails
 */
function initializeDatabase(dbPath, options = {}) {
  const { verbose = false, memory = false } = options;

  try {
    // Ensure database directory exists (unless using in-memory)
    if (!memory && dbPath !== ':memory:') {
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    }

    // Create database connection
    const db = new Database(memory ? ':memory:' : dbPath, {
      verbose: verbose ? console.log : undefined
    });

    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');

    // Create all tables
    createTables(db);

    // Create all indexes
    createIndexes(db);

    // Initialize or verify schema version
    initializeSchemaVersion(db);

    if (verbose) {
      console.log(`Database initialized successfully at ${memory ? 'memory' : dbPath}`);
    }

    return db;
  } catch (error) {
    throw new Error(`Failed to initialize database: ${error.message}`);
  }
}

/**
 * Create all database tables
 * @param {Database} db - Database connection
 * @throws {Error} - If table creation fails
 */
function createTables(db) {
  try {
    // Create tables in order (respecting foreign key dependencies)
    const tableOrder = [
      'vehicles',
      'lap_times',
      'telemetry',
      'race_results',
      'section_times',
      'weather',
      'schema_version'
    ];

    for (const tableName of tableOrder) {
      const sql = CREATE_TABLES[tableName];
      if (!sql) {
        throw new Error(`Table definition not found for: ${tableName}`);
      }
      db.exec(sql);
    }
  } catch (error) {
    throw new Error(`Failed to create tables: ${error.message}`);
  }
}

/**
 * Create all database indexes
 * @param {Database} db - Database connection
 * @throws {Error} - If index creation fails
 */
function createIndexes(db) {
  try {
    for (const [indexName, sql] of Object.entries(CREATE_INDEXES)) {
      db.exec(sql);
    }
  } catch (error) {
    throw new Error(`Failed to create indexes: ${error.message}`);
  }
}

/**
 * Initialize or verify schema version
 * @param {Database} db - Database connection
 * @throws {Error} - If schema version operations fail
 */
function initializeSchemaVersion(db) {
  try {
    // Check if schema_version table has any records
    const versionCheck = db.prepare('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1').get();

    if (!versionCheck) {
      // First time initialization - insert current version
      const insertVersion = db.prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)');
      insertVersion.run(CURRENT_SCHEMA_VERSION, new Date().toISOString());
    } else {
      // Verify schema compatibility
      const existingVersion = versionCheck.version;
      if (existingVersion > CURRENT_SCHEMA_VERSION) {
        throw new Error(
          `Database schema version (${existingVersion}) is newer than application version (${CURRENT_SCHEMA_VERSION}). ` +
          'Please update the application.'
        );
      }
      // If existingVersion < CURRENT_SCHEMA_VERSION, migrations would be applied here
      // For now, we just verify compatibility
    }
  } catch (error) {
    throw new Error(`Failed to initialize schema version: ${error.message}`);
  }
}

/**
 * Get current schema version from database
 * @param {Database} db - Database connection
 * @returns {number|null} - Current schema version or null if not initialized
 */
function getSchemaVersion(db) {
  try {
    const result = db.prepare('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1').get();
    return result ? result.version : null;
  } catch (error) {
    // Table might not exist yet
    return null;
  }
}

/**
 * Check if database is properly initialized
 * @param {Database} db - Database connection
 * @returns {boolean} - True if all required tables exist
 */
function isDatabaseInitialized(db) {
  try {
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all();

    const tableNames = tables.map(t => t.name);
    const requiredTables = ['vehicles', 'lap_times', 'telemetry', 'race_results', 'section_times', 'weather', 'schema_version'];

    return requiredTables.every(table => tableNames.includes(table));
  } catch (error) {
    return false;
  }
}

/**
 * Close database connection safely
 * @param {Database} db - Database connection
 */
function closeDatabase(db) {
  if (db && db.open) {
    db.close();
  }
}

export {
  initializeDatabase,
  createTables,
  createIndexes,
  initializeSchemaVersion,
  getSchemaVersion,
  isDatabaseInitialized,
  closeDatabase
};
