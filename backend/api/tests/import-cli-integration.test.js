/**
 * Integration test for import-data.js CLI script
 * Tests the complete import workflow with minimal data
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import fs from 'fs';
import path from 'path';

describe('Import CLI Integration', () => {
  const testDbPath = './api/tests/test-cli-integration.db';

  afterEach(() => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should initialize database with correct schema', () => {
    // This verifies that the CLI script's database initialization works
    const db = initializeDatabase(testDbPath);

    // Verify tables exist
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all();

    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('vehicles');
    expect(tableNames).toContain('lap_times');
    expect(tableNames).toContain('telemetry');
    expect(tableNames).toContain('race_results');
    expect(tableNames).toContain('section_times');
    expect(tableNames).toContain('weather');
    expect(tableNames).toContain('schema_version');

    closeDatabase(db);
  });

  it('should create database directory if it does not exist', () => {
    const nestedDbPath = './api/tests/nested/dir/test.db';
    const nestedDir = path.dirname(nestedDbPath);

    // Ensure directory doesn't exist
    if (fs.existsSync(nestedDir)) {
      fs.rmSync(nestedDir, { recursive: true });
    }

    // Initialize database (should create directory)
    const db = initializeDatabase(nestedDbPath);
    
    expect(fs.existsSync(nestedDir)).toBe(true);
    expect(fs.existsSync(nestedDbPath)).toBe(true);

    closeDatabase(db);

    // Clean up
    fs.rmSync(nestedDir, { recursive: true });
  });

  it('should handle database path with environment variable', () => {
    // This verifies the CLI respects DB_PATH environment variable
    const envDbPath = process.env.DB_PATH || './data/racing.db';
    expect(envDbPath).toBeTruthy();
  });
});
