/**
 * Results Service Tests
 * Tests for race results service business logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import {
  getAllResults,
  getResultByVehicle,
  getResultsByClass
} from '../services/results-service.js';

describe('Results Service', () => {
  let db;

  beforeEach(() => {
    // Create in-memory database for testing
    db = initializeDatabase(':memory:', { memory: true });
  });

  afterEach(() => {
    closeDatabase(db);
  });

  /**
   * Helper function to insert test vehicles (required for foreign key)
   */
  function insertVehicles(vehicles) {
    const stmt = db.prepare(`
      INSERT INTO vehicles (vehicle_id, car_number, class, fastest_lap, average_lap, total_laps, max_speed, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const vehicle of vehicles) {
      stmt.run(
        vehicle.vehicle_id,
        vehicle.car_number,
        vehicle.class,
        vehicle.fastest_lap || 150000,
        vehicle.average_lap || 152000,
        vehicle.total_laps || 45,
        vehicle.max_speed || 180,
        vehicle.position || 1
      );
    }
  }

  /**
   * Helper function to insert test race results
   */
  function insertResults(results) {
    // First insert vehicles to satisfy foreign key constraint
    const vehicles = results.map(r => ({
      vehicle_id: r.vehicle_id,
      car_number: r.car_number,
      class: r.class,
      position: r.position
    }));
    insertVehicles(vehicles);

    // Then insert results
    const stmt = db.prepare(`
      INSERT INTO race_results (vehicle_id, position, car_number, laps, total_time, gap_first, gap_previous, best_lap_time, class)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const result of results) {
      stmt.run(
        result.vehicle_id,
        result.position,
        result.car_number,
        result.laps,
        result.total_time,
        result.gap_first,
        result.gap_previous,
        result.best_lap_time,
        result.class
      );
    }
  }

  describe('getAllResults', () => {
    it('should return all results when no filter is applied', () => {
      const results = [
        { vehicle_id: 'GR86-001', position: 1, car_number: 1, laps: 45, total_time: '1:45:30.123', gap_first: '0.000', gap_previous: '0.000', best_lap_time: '2:28.630', class: 'Pro' },
        { vehicle_id: 'GR86-002', position: 2, car_number: 2, laps: 45, total_time: '1:45:35.456', gap_first: '5.333', gap_previous: '5.333', best_lap_time: '2:29.120', class: 'Am' }
      ];
      insertResults(results);

      const result = getAllResults(db);
      expect(result).toHaveLength(2);
    });

    it('should filter by class', () => {
      const results = [
        { vehicle_id: 'GR86-001', position: 1, car_number: 1, laps: 45, total_time: '1:45:30.123', gap_first: '0.000', gap_previous: '0.000', best_lap_time: '2:28.630', class: 'Pro' },
        { vehicle_id: 'GR86-002', position: 2, car_number: 2, laps: 45, total_time: '1:45:35.456', gap_first: '5.333', gap_previous: '5.333', best_lap_time: '2:29.120', class: 'Am' },
        { vehicle_id: 'GR86-003', position: 3, car_number: 3, laps: 45, total_time: '1:45:40.789', gap_first: '10.666', gap_previous: '5.333', best_lap_time: '2:29.450', class: 'Pro' }
      ];
      insertResults(results);

      const result = getAllResults(db, { class: 'Pro' });
      expect(result).toHaveLength(2);
      expect(result.every(r => r.class === 'Pro')).toBe(true);
    });

    it('should sort by position ascending by default', () => {
      const results = [
        { vehicle_id: 'GR86-003', position: 3, car_number: 3, laps: 45, total_time: '1:45:40.789', gap_first: '10.666', gap_previous: '5.333', best_lap_time: '2:29.450', class: 'Pro' },
        { vehicle_id: 'GR86-001', position: 1, car_number: 1, laps: 45, total_time: '1:45:30.123', gap_first: '0.000', gap_previous: '0.000', best_lap_time: '2:28.630', class: 'Pro' },
        { vehicle_id: 'GR86-002', position: 2, car_number: 2, laps: 45, total_time: '1:45:35.456', gap_first: '5.333', gap_previous: '5.333', best_lap_time: '2:29.120', class: 'Am' }
      ];
      insertResults(results);

      const result = getAllResults(db);
      expect(result[0].position).toBe(1);
      expect(result[1].position).toBe(2);
      expect(result[2].position).toBe(3);
    });

    it('should sort by specified field and order', () => {
      const results = [
        { vehicle_id: 'GR86-001', position: 1, car_number: 1, laps: 45, total_time: '1:45:30.123', gap_first: '0.000', gap_previous: '0.000', best_lap_time: '2:28.630', class: 'Pro' },
        { vehicle_id: 'GR86-002', position: 2, car_number: 2, laps: 44, total_time: '1:45:35.456', gap_first: '5.333', gap_previous: '5.333', best_lap_time: '2:29.120', class: 'Am' },
        { vehicle_id: 'GR86-003', position: 3, car_number: 3, laps: 46, total_time: '1:45:40.789', gap_first: '10.666', gap_previous: '5.333', best_lap_time: '2:29.450', class: 'Pro' }
      ];
      insertResults(results);

      const result = getAllResults(db, { sortBy: 'laps', order: 'desc' });
      expect(result[0].laps).toBe(46);
      expect(result[1].laps).toBe(45);
      expect(result[2].laps).toBe(44);
    });
  });

  describe('getResultByVehicle', () => {
    it('should return result when vehicle ID exists', () => {
      const results = [
        { vehicle_id: 'GR86-004-78', position: 5, car_number: 78, laps: 45, total_time: '1:45:50.123', gap_first: '20.000', gap_previous: '5.000', best_lap_time: '2:28.630', class: 'Am' }
      ];
      insertResults(results);

      const result = getResultByVehicle(db, 'GR86-004-78');
      expect(result).not.toBeNull();
      expect(result.vehicle_id).toBe('GR86-004-78');
      expect(result.position).toBe(5);
      expect(result.car_number).toBe(78);
    });

    it('should return null when vehicle ID does not exist', () => {
      const result = getResultByVehicle(db, 'NON-EXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('getResultsByClass', () => {
    it('should return results for specified class', () => {
      const results = [
        { vehicle_id: 'GR86-001', position: 1, car_number: 1, laps: 45, total_time: '1:45:30.123', gap_first: '0.000', gap_previous: '0.000', best_lap_time: '2:28.630', class: 'Pro' },
        { vehicle_id: 'GR86-002', position: 2, car_number: 2, laps: 45, total_time: '1:45:35.456', gap_first: '5.333', gap_previous: '5.333', best_lap_time: '2:29.120', class: 'Am' },
        { vehicle_id: 'GR86-003', position: 3, car_number: 3, laps: 45, total_time: '1:45:40.789', gap_first: '10.666', gap_previous: '5.333', best_lap_time: '2:29.450', class: 'Pro' },
        { vehicle_id: 'GR86-004', position: 4, car_number: 4, laps: 45, total_time: '1:45:45.123', gap_first: '15.000', gap_previous: '4.334', best_lap_time: '2:29.780', class: 'Am' }
      ];
      insertResults(results);

      const result = getResultsByClass(db, 'Pro');
      expect(result).toHaveLength(2);
      expect(result.every(r => r.class === 'Pro')).toBe(true);
    });

    it('should return empty array for non-existent class', () => {
      const results = [
        { vehicle_id: 'GR86-001', position: 1, car_number: 1, laps: 45, total_time: '1:45:30.123', gap_first: '0.000', gap_previous: '0.000', best_lap_time: '2:28.630', class: 'Pro' }
      ];
      insertResults(results);

      const result = getResultsByClass(db, 'NonExistent');
      expect(result).toHaveLength(0);
    });

    it('should sort results by specified field', () => {
      const results = [
        { vehicle_id: 'GR86-001', position: 1, car_number: 10, laps: 45, total_time: '1:45:30.123', gap_first: '0.000', gap_previous: '0.000', best_lap_time: '2:28.630', class: 'Pro' },
        { vehicle_id: 'GR86-003', position: 3, car_number: 5, laps: 45, total_time: '1:45:40.789', gap_first: '10.666', gap_previous: '5.333', best_lap_time: '2:29.450', class: 'Pro' }
      ];
      insertResults(results);

      const result = getResultsByClass(db, 'Pro', { sortBy: 'car_number', order: 'asc' });
      expect(result[0].car_number).toBe(5);
      expect(result[1].car_number).toBe(10);
    });
  });
});
