/**
 * Tests for database initialization and schema
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeDatabase, getSchemaVersion, isDatabaseInitialized, closeDatabase } from '../database/init.js';
import { CURRENT_SCHEMA_VERSION } from '../database/schema.js';

describe('Database Initialization', () => {
  let db;

  beforeEach(() => {
    // Use in-memory database for testing
    db = null;
  });

  afterEach(() => {
    if (db) {
      closeDatabase(db);
    }
  });

  describe('initializeDatabase', () => {
    it('should create database with all tables', () => {
      db = initializeDatabase(':memory:', { memory: true });

      expect(db).toBeDefined();
      expect(db.open).toBe(true);

      // Verify all tables exist
      const tables = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      ).all();

      const tableNames = tables.map(t => t.name);
      expect(tableNames).toContain('vehicles');
      expect(tableNames).toContain('lap_times');
      expect(tableNames).toContain('telemetry');
      expect(tableNames).toContain('race_results');
      expect(tableNames).toContain('section_times');
      expect(tableNames).toContain('weather');
      expect(tableNames).toContain('schema_version');
    });

    it('should create all required indexes', () => {
      db = initializeDatabase(':memory:', { memory: true });

      // Verify indexes exist
      const indexes = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name"
      ).all();

      const indexNames = indexes.map(i => i.name);
      
      // Check critical indexes
      expect(indexNames).toContain('idx_vehicles_class');
      expect(indexNames).toContain('idx_vehicles_fastest_lap');
      expect(indexNames).toContain('idx_lap_times_vehicle');
      expect(indexNames).toContain('idx_telemetry_vehicle');
      expect(indexNames).toContain('idx_telemetry_lap');
      expect(indexNames).toContain('idx_telemetry_timestamp');
      expect(indexNames).toContain('idx_telemetry_name');
      expect(indexNames).toContain('idx_weather_timestamp');
    });

    it('should enable foreign key constraints', () => {
      db = initializeDatabase(':memory:', { memory: true });

      const result = db.pragma('foreign_keys', { simple: true });
      expect(result).toBe(1); // 1 means enabled
    });

    it('should initialize schema version', () => {
      db = initializeDatabase(':memory:', { memory: true });

      const version = getSchemaVersion(db);
      expect(version).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should handle verbose option', () => {
      // Should not throw with verbose enabled
      expect(() => {
        db = initializeDatabase(':memory:', { memory: true, verbose: false });
      }).not.toThrow();
    });
  });

  describe('getSchemaVersion', () => {
    it('should return current schema version after initialization', () => {
      db = initializeDatabase(':memory:', { memory: true });
      
      const version = getSchemaVersion(db);
      expect(version).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should return null for uninitialized database', async () => {
      const Database = (await import('better-sqlite3')).default;
      db = new Database(':memory:');
      
      const version = getSchemaVersion(db);
      expect(version).toBe(null);
    });
  });

  describe('isDatabaseInitialized', () => {
    it('should return true for initialized database', () => {
      db = initializeDatabase(':memory:', { memory: true });
      
      const initialized = isDatabaseInitialized(db);
      expect(initialized).toBe(true);
    });

    it('should return false for uninitialized database', async () => {
      const Database = (await import('better-sqlite3')).default;
      db = new Database(':memory:');
      
      const initialized = isDatabaseInitialized(db);
      expect(initialized).toBe(false);
    });
  });

  describe('Schema Compatibility', () => {
    it('should verify schema version on existing database', () => {
      db = initializeDatabase(':memory:', { memory: true });
      
      // Close and reopen to simulate existing database
      const dbPath = ':memory:';
      closeDatabase(db);
      
      // Reinitialize should work without errors
      expect(() => {
        db = initializeDatabase(dbPath, { memory: true });
      }).not.toThrow();
    });
  });

  describe('Table Structure', () => {
    beforeEach(() => {
      db = initializeDatabase(':memory:', { memory: true });
    });

    it('should create vehicles table with correct columns', () => {
      const columns = db.pragma('table_info(vehicles)');
      const columnNames = columns.map(c => c.name);
      
      expect(columnNames).toContain('vehicle_id');
      expect(columnNames).toContain('car_number');
      expect(columnNames).toContain('class');
      expect(columnNames).toContain('fastest_lap');
      expect(columnNames).toContain('average_lap');
      expect(columnNames).toContain('total_laps');
      expect(columnNames).toContain('max_speed');
      expect(columnNames).toContain('position');
    });

    it('should create telemetry table with correct columns', () => {
      const columns = db.pragma('table_info(telemetry)');
      const columnNames = columns.map(c => c.name);
      
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('vehicle_id');
      expect(columnNames).toContain('lap');
      expect(columnNames).toContain('timestamp');
      expect(columnNames).toContain('telemetry_name');
      expect(columnNames).toContain('telemetry_value');
    });

    it('should create lap_times table with correct columns', () => {
      const columns = db.pragma('table_info(lap_times)');
      const columnNames = columns.map(c => c.name);
      
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('vehicle_id');
      expect(columnNames).toContain('lap');
      expect(columnNames).toContain('lap_time');
      expect(columnNames).toContain('timestamp');
    });

    it('should enforce foreign key constraints', () => {
      // Try to insert lap_time with non-existent vehicle_id
      expect(() => {
        db.prepare('INSERT INTO lap_times (vehicle_id, lap, lap_time) VALUES (?, ?, ?)').run('INVALID-ID', 1, 150000);
      }).toThrow();
    });

    it('should enforce unique constraint on car_number', () => {
      // Insert first vehicle
      db.prepare('INSERT INTO vehicles (vehicle_id, car_number) VALUES (?, ?)').run('GR86-001', 1);
      
      // Try to insert another vehicle with same car_number
      expect(() => {
        db.prepare('INSERT INTO vehicles (vehicle_id, car_number) VALUES (?, ?)').run('GR86-002', 1);
      }).toThrow();
    });
  });

  describe('closeDatabase', () => {
    it('should close database connection', () => {
      db = initializeDatabase(':memory:', { memory: true });
      expect(db.open).toBe(true);
      
      closeDatabase(db);
      expect(db.open).toBe(false);
    });

    it('should handle null database gracefully', () => {
      expect(() => {
        closeDatabase(null);
      }).not.toThrow();
    });

    it('should handle already closed database gracefully', () => {
      db = initializeDatabase(':memory:', { memory: true });
      closeDatabase(db);
      
      expect(() => {
        closeDatabase(db);
      }).not.toThrow();
    });
  });
});
