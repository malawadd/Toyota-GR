import { describe, it, expect } from 'vitest';
import { analyzeTelemetry } from '../analyzers/telemetry-analyzer.js';

describe('Telemetry Analyzer', () => {
  it('should return null values for empty dataset', () => {
    const result = analyzeTelemetry([]);
    
    expect(result.maxSpeed).toBeNull();
    expect(result.avgSpeed).toBeNull();
    expect(result.maxBrakeFront).toBeNull();
    expect(result.maxBrakeRear).toBeNull();
    expect(result.byVehicle.size).toBe(0);
  });

  it('should calculate maximum speed per vehicle', () => {
    const records = [
      { vehicle_id: 'GR86-001', telemetry_name: 'speed_can', telemetry_value: 120.5, lap: 1, timestamp: new Date() },
      { vehicle_id: 'GR86-001', telemetry_name: 'speed_can', telemetry_value: 135.2, lap: 1, timestamp: new Date() },
      { vehicle_id: 'GR86-001', telemetry_name: 'speed_can', telemetry_value: 128.0, lap: 1, timestamp: new Date() },
      { vehicle_id: 'GR86-002', telemetry_name: 'speed_can', telemetry_value: 130.0, lap: 1, timestamp: new Date() },
      { vehicle_id: 'GR86-002', telemetry_name: 'speed_can', telemetry_value: 140.5, lap: 1, timestamp: new Date() }
    ];

    const result = analyzeTelemetry(records);
    
    expect(result.maxSpeed).toBe(140.5);
    expect(result.byVehicle.get('GR86-001').maxSpeed).toBe(135.2);
    expect(result.byVehicle.get('GR86-002').maxSpeed).toBe(140.5);
  });

  it('should calculate average speed per vehicle', () => {
    const records = [
      { vehicle_id: 'GR86-001', telemetry_name: 'speed_can', telemetry_value: 100, lap: 1, timestamp: new Date() },
      { vehicle_id: 'GR86-001', telemetry_name: 'speed_can', telemetry_value: 120, lap: 1, timestamp: new Date() },
      { vehicle_id: 'GR86-001', telemetry_name: 'speed_can', telemetry_value: 110, lap: 1, timestamp: new Date() }
    ];

    const result = analyzeTelemetry(records);
    
    expect(result.avgSpeed).toBe(110);
    expect(result.byVehicle.get('GR86-001').avgSpeed).toBe(110);
  });

  it('should identify maximum brake pressures', () => {
    const records = [
      { vehicle_id: 'GR86-001', telemetry_name: 'brake_front', telemetry_value: 85.5, lap: 1, timestamp: new Date() },
      { vehicle_id: 'GR86-001', telemetry_name: 'brake_front', telemetry_value: 92.3, lap: 1, timestamp: new Date() },
      { vehicle_id: 'GR86-001', telemetry_name: 'brake_rear', telemetry_value: 65.2, lap: 1, timestamp: new Date() },
      { vehicle_id: 'GR86-001', telemetry_name: 'brake_rear', telemetry_value: 70.8, lap: 1, timestamp: new Date() },
      { vehicle_id: 'GR86-002', telemetry_name: 'brake_front', telemetry_value: 95.0, lap: 1, timestamp: new Date() },
      { vehicle_id: 'GR86-002', telemetry_name: 'brake_rear', telemetry_value: 72.5, lap: 1, timestamp: new Date() }
    ];

    const result = analyzeTelemetry(records);
    
    expect(result.maxBrakeFront).toBe(95.0);
    expect(result.maxBrakeRear).toBe(72.5);
    expect(result.byVehicle.get('GR86-001').maxBrakeFront).toBe(92.3);
    expect(result.byVehicle.get('GR86-001').maxBrakeRear).toBe(70.8);
    expect(result.byVehicle.get('GR86-002').maxBrakeFront).toBe(95.0);
    expect(result.byVehicle.get('GR86-002').maxBrakeRear).toBe(72.5);
  });

  it('should filter by vehicle ID when specified', () => {
    const records = [
      { vehicle_id: 'GR86-001', telemetry_name: 'speed_can', telemetry_value: 120, lap: 1, timestamp: new Date() },
      { vehicle_id: 'GR86-002', telemetry_name: 'speed_can', telemetry_value: 140, lap: 1, timestamp: new Date() }
    ];

    const result = analyzeTelemetry(records, 'GR86-001');
    
    expect(result.maxSpeed).toBe(120);
    expect(result.byVehicle.size).toBe(1);
    expect(result.byVehicle.has('GR86-001')).toBe(true);
    expect(result.byVehicle.has('GR86-002')).toBe(false);
  });

  it('should handle mixed telemetry types', () => {
    const records = [
      { vehicle_id: 'GR86-001', telemetry_name: 'speed_can', telemetry_value: 120, lap: 1, timestamp: new Date() },
      { vehicle_id: 'GR86-001', telemetry_name: 'gear', telemetry_value: 4, lap: 1, timestamp: new Date() },
      { vehicle_id: 'GR86-001', telemetry_name: 'throttle', telemetry_value: 85.5, lap: 1, timestamp: new Date() },
      { vehicle_id: 'GR86-001', telemetry_name: 'brake_front', telemetry_value: 90, lap: 1, timestamp: new Date() }
    ];

    const result = analyzeTelemetry(records);
    
    expect(result.maxSpeed).toBe(120);
    expect(result.maxBrakeFront).toBe(90);
    expect(result.byVehicle.get('GR86-001').maxSpeed).toBe(120);
    expect(result.byVehicle.get('GR86-001').maxBrakeFront).toBe(90);
  });

  it('should return null for missing telemetry types', () => {
    const records = [
      { vehicle_id: 'GR86-001', telemetry_name: 'speed_can', telemetry_value: 120, lap: 1, timestamp: new Date() }
    ];

    const result = analyzeTelemetry(records);
    
    expect(result.maxSpeed).toBe(120);
    expect(result.maxBrakeFront).toBeNull();
    expect(result.maxBrakeRear).toBeNull();
  });
});
