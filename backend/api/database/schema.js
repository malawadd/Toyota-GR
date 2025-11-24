/**
 * Database schema definition for Racing Data API
 * Defines all tables, indexes, and constraints for SQLite database
 */

/**
 * SQL statements to create all database tables
 */
const CREATE_TABLES = {
  vehicles: `
    CREATE TABLE IF NOT EXISTS vehicles (
      vehicle_id TEXT PRIMARY KEY,
      car_number INTEGER UNIQUE,
      class TEXT,
      fastest_lap REAL,
      average_lap REAL,
      total_laps INTEGER,
      max_speed REAL,
      position INTEGER
    )
  `,

  lap_times: `
    CREATE TABLE IF NOT EXISTS lap_times (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id TEXT NOT NULL,
      lap INTEGER NOT NULL,
      lap_time REAL NOT NULL,
      timestamp TEXT,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
    )
  `,

  telemetry: `
    CREATE TABLE IF NOT EXISTS telemetry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id TEXT NOT NULL,
      lap INTEGER,
      timestamp TEXT NOT NULL,
      telemetry_name TEXT NOT NULL,
      telemetry_value REAL NOT NULL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
    )
  `,

  race_results: `
    CREATE TABLE IF NOT EXISTS race_results (
      vehicle_id TEXT PRIMARY KEY,
      position INTEGER NOT NULL,
      car_number INTEGER NOT NULL,
      laps INTEGER NOT NULL,
      total_time TEXT,
      gap_first TEXT,
      gap_previous TEXT,
      best_lap_time TEXT,
      class TEXT,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
    )
  `,

  section_times: `
    CREATE TABLE IF NOT EXISTS section_times (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id TEXT NOT NULL,
      lap INTEGER NOT NULL,
      s1 REAL,
      s2 REAL,
      s3 REAL,
      lap_time REAL,
      top_speed REAL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
    )
  `,

  weather: `
    CREATE TABLE IF NOT EXISTS weather (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      air_temp REAL,
      track_temp REAL,
      humidity REAL,
      pressure REAL,
      wind_speed REAL,
      wind_direction REAL,
      rain REAL
    )
  `,

  schema_version: `
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `
};

/**
 * SQL statements to create indexes for optimized queries
 */
const CREATE_INDEXES = {
  // Vehicle indexes
  vehicles_class: 'CREATE INDEX IF NOT EXISTS idx_vehicles_class ON vehicles(class)',
  vehicles_fastest_lap: 'CREATE INDEX IF NOT EXISTS idx_vehicles_fastest_lap ON vehicles(fastest_lap)',

  // Lap times indexes
  lap_times_vehicle: 'CREATE INDEX IF NOT EXISTS idx_lap_times_vehicle ON lap_times(vehicle_id)',
  lap_times_lap: 'CREATE INDEX IF NOT EXISTS idx_lap_times_lap ON lap_times(lap)',
  lap_times_time: 'CREATE INDEX IF NOT EXISTS idx_lap_times_time ON lap_times(lap_time)',

  // Telemetry indexes (critical for performance)
  telemetry_vehicle: 'CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle ON telemetry(vehicle_id)',
  telemetry_lap: 'CREATE INDEX IF NOT EXISTS idx_telemetry_lap ON telemetry(vehicle_id, lap)',
  telemetry_timestamp: 'CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry(timestamp)',
  telemetry_name: 'CREATE INDEX IF NOT EXISTS idx_telemetry_name ON telemetry(telemetry_name)',

  // Race results indexes
  results_position: 'CREATE INDEX IF NOT EXISTS idx_results_position ON race_results(position)',

  // Section times indexes
  section_vehicle: 'CREATE INDEX IF NOT EXISTS idx_section_vehicle ON section_times(vehicle_id)',
  section_lap: 'CREATE INDEX IF NOT EXISTS idx_section_lap ON section_times(vehicle_id, lap)',

  // Weather indexes
  weather_timestamp: 'CREATE INDEX IF NOT EXISTS idx_weather_timestamp ON weather(timestamp)'
};

/**
 * Current schema version
 */
const CURRENT_SCHEMA_VERSION = 1;

export {
  CREATE_TABLES,
  CREATE_INDEXES,
  CURRENT_SCHEMA_VERSION
};
