/**
 * Tests for import-data.js CLI script
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Import CLI Script', () => {
  const testDbPath = './api/tests/test-cli-import.db';

  afterEach(() => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should display help message when --help flag is used', (done) => {
    const child = spawn('node', ['api/import-data.js', '--help']);
    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(output).toContain('Racing Data Import CLI');
      expect(output).toContain('Usage:');
      expect(output).toContain('Arguments:');
      expect(output).toContain('Options:');
      expect(output).toContain('Examples:');
      done();
    });
  });

  it('should show error when no data directory is provided', (done) => {
    const child = spawn('node', ['api/import-data.js']);
    let output = '';

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      expect(code).toBe(1);
      expect(output).toContain('Error: Data directory is required');
      done();
    });
  });

  it('should show error when data directory does not exist', (done) => {
    const child = spawn('node', ['api/import-data.js', 'nonexistent-directory']);
    let output = '';

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      expect(code).toBe(1);
      expect(output).toContain('Error: Data directory not found');
      done();
    });
  });

  it('should accept database path option', (done) => {
    const child = spawn('node', ['api/import-data.js', '.', '--db', testDbPath]);
    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    // Kill after 5 seconds since full import takes too long
    const timeout = setTimeout(() => {
      child.kill();
    }, 5000);

    child.on('close', () => {
      clearTimeout(timeout);
      expect(output).toContain('Racing Data Import');
      expect(output).toContain('Database path:');
      expect(output).toContain('Initializing database');
      done();
    });
  });

  it('should accept verbose flag', (done) => {
    const child = spawn('node', ['api/import-data.js', '.', '--db', testDbPath, '--verbose']);
    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Kill after 3 seconds
    const timeout = setTimeout(() => {
      child.kill();
    }, 3000);

    child.on('close', () => {
      clearTimeout(timeout);
      expect(output).toContain('Racing Data Import');
      done();
    });
  });

  it('should report progress during import', (done) => {
    const child = spawn('node', ['api/import-data.js', '.', '--db', testDbPath]);
    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Kill after 5 seconds
    const timeout = setTimeout(() => {
      child.kill();
    }, 5000);

    child.on('close', () => {
      clearTimeout(timeout);
      expect(output).toContain('Starting race data import');
      expect(output).toContain('Found CSV files');
      expect(output).toContain('Parsing CSV files');
      done();
    });
  });
});
