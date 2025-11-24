import { describe, it, expect } from 'vitest';
import { analyzeLapTimes } from '../analyzers/lap-analyzer.js';

describe('Lap Analyzer', () => {
  it('should handle empty input', () => {
    const result = analyzeLapTimes([]);
    expect(result.fastest).toBeNull();
    expect(result.average).toBeNull();
    expect(result.stdDev).toBeNull();
    expect(result.byVehicle.size).toBe(0);
    expect(result.rankings.length).toBe(0);
  });

  it('should calculate fastest lap per vehicle', () => {
    const lapRecords = [
      { vehicle_id: 'GR86-001', lap: 1, value: 90000, timestamp: new Date() },
      { vehicle_id: 'GR86-001', lap: 2, value: 88000, timestamp: new Date() },
      { vehicle_id: 'GR86-002', lap: 1, value: 92000, timestamp: new Date() },
      { vehicle_id: 'GR86-002', lap: 2, value: 89000, timestamp: new Date() }
    ];

    const result = analyzeLapTimes(lapRecords);
    
    expect(result.byVehicle.get('GR86-001').fastest).toBe(88000);
    expect(result.byVehicle.get('GR86-002').fastest).toBe(89000);
  });

  it('should calculate average lap time per vehicle', () => {
    const lapRecords = [
      { vehicle_id: 'GR86-001', lap: 1, value: 90000, timestamp: new Date() },
      { vehicle_id: 'GR86-001', lap: 2, value: 88000, timestamp: new Date() }
    ];

    const result = analyzeLapTimes(lapRecords);
    
    expect(result.byVehicle.get('GR86-001').average).toBe(89000);
  });

  it('should calculate standard deviation per vehicle', () => {
    const lapRecords = [
      { vehicle_id: 'GR86-001', lap: 1, value: 90000, timestamp: new Date() },
      { vehicle_id: 'GR86-001', lap: 2, value: 88000, timestamp: new Date() },
      { vehicle_id: 'GR86-001', lap: 3, value: 92000, timestamp: new Date() }
    ];

    const result = analyzeLapTimes(lapRecords);
    
    expect(result.byVehicle.get('GR86-001').stdDev).toBeGreaterThan(0);
  });

  it('should rank vehicles by fastest lap', () => {
    const lapRecords = [
      { vehicle_id: 'GR86-001', lap: 1, value: 90000, timestamp: new Date() },
      { vehicle_id: 'GR86-001', lap: 2, value: 88000, timestamp: new Date() },
      { vehicle_id: 'GR86-002', lap: 1, value: 92000, timestamp: new Date() },
      { vehicle_id: 'GR86-002', lap: 2, value: 85000, timestamp: new Date() },
      { vehicle_id: 'GR86-003', lap: 1, value: 95000, timestamp: new Date() }
    ];

    const result = analyzeLapTimes(lapRecords);
    
    expect(result.rankings.length).toBe(3);
    expect(result.rankings[0].vehicle).toBe('GR86-002');
    expect(result.rankings[0].rank).toBe(1);
    expect(result.rankings[0].fastest).toBe(85000);
    expect(result.rankings[1].vehicle).toBe('GR86-001');
    expect(result.rankings[1].rank).toBe(2);
    expect(result.rankings[2].vehicle).toBe('GR86-003');
    expect(result.rankings[2].rank).toBe(3);
  });

  it('should calculate overall statistics', () => {
    const lapRecords = [
      { vehicle_id: 'GR86-001', lap: 1, value: 90000, timestamp: new Date() },
      { vehicle_id: 'GR86-001', lap: 2, value: 88000, timestamp: new Date() },
      { vehicle_id: 'GR86-002', lap: 1, value: 92000, timestamp: new Date() }
    ];

    const result = analyzeLapTimes(lapRecords);
    
    expect(result.fastest).toBe(88000);
    expect(result.average).toBe(90000);
    expect(result.stdDev).toBeGreaterThan(0);
  });

  it('should handle single lap per vehicle', () => {
    const lapRecords = [
      { vehicle_id: 'GR86-001', lap: 1, value: 90000, timestamp: new Date() }
    ];

    const result = analyzeLapTimes(lapRecords);
    
    expect(result.byVehicle.get('GR86-001').fastest).toBe(90000);
    expect(result.byVehicle.get('GR86-001').average).toBe(90000);
    expect(result.byVehicle.get('GR86-001').stdDev).toBe(0);
  });
});
