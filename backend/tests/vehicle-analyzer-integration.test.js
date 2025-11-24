import { describe, it, expect } from 'vitest';
import { queryVehicle } from '../queries/vehicle-query.js';
import { analyzeVehicleData } from '../analyzers/vehicle-analyzer.js';

describe('Vehicle Analyzer Integration', () => {
  it('should analyze vehicle data from queryVehicle result', async () => {
    // Mock data that would come from parsed CSV files
    const allData = {
      lapTimes: [
        { vehicle_id: 'GR86-004-78', lap: 1, value: 150000, timestamp: new Date() },
        { vehicle_id: 'GR86-004-78', lap: 2, value: 148000, timestamp: new Date() },
        { vehicle_id: 'GR86-004-78', lap: 3, value: 149000, timestamp: new Date() }
      ],
      results: [
        {
          position: 5,
          number: 78,
          laps: 3,
          total_time: '7:27.000',
          gap_first: '+15.234',
          gap_previous: '+2.456',
          best_lap_time: '2:28.000',
          class: 'Am'
        }
      ],
      telemetry: [
        { vehicle_id: 'GR86-004-78', telemetry_name: 'vCar', telemetry_value: 180.5, timestamp: new Date() },
        { vehicle_id: 'GR86-004-78', telemetry_name: 'vCar', telemetry_value: 185.2, timestamp: new Date() },
        { vehicle_id: 'GR86-004-78', telemetry_name: 'brake_front', telemetry_value: 85.5, timestamp: new Date() }
      ],
      sections: [
        { number: 78, lap_number: 1, s1: '0:35.123', s2: '0:42.456', s3: '0:38.789', top_speed: 185.5 },
        { number: 78, lap_number: 2, s1: '0:34.987', s2: '0:42.123', s3: '0:38.456', top_speed: 186.2 }
      ]
    };

    // Query vehicle by ID
    const vehicleData = await queryVehicle('GR86-004-78', allData);
    
    // Analyze the queried data
    const analysis = analyzeVehicleData(vehicleData);

    // Verify the analysis contains expected data
    expect(analysis.vehicleId).toBe('GR86-004-78');
    expect(analysis.carNumber).toBe(78);
    expect(analysis.class).toBe('Am');
    
    // Verify lap statistics
    expect(analysis.lapStatistics.totalLaps).toBe(3);
    expect(analysis.lapStatistics.fastestLap).toBe(148000);
    expect(analysis.lapStatistics.averageLap).toBe(149000);
    
    // Verify race statistics
    expect(analysis.raceStatistics.position).toBe(5);
    expect(analysis.raceStatistics.totalLaps).toBe(3);
    
    // Verify telemetry statistics
    expect(analysis.telemetryStatistics.maxSpeed).toBe(185.2);
    expect(analysis.telemetryStatistics.dataPoints).toBe(3);
    
    // Verify section statistics
    expect(analysis.sectionStatistics.s1.count).toBe(2);
    expect(analysis.sectionStatistics.topSpeed).toBe(186.2);
    
    // Verify overall statistics
    expect(analysis.overallStatistics.fastestLap).toBe(148000);
    expect(analysis.overallStatistics.position).toBe(5);
    expect(analysis.overallStatistics.maxSpeed).toBe(185.2);
    expect(analysis.overallStatistics.dataQuality.hasLapData).toBe(true);
    expect(analysis.overallStatistics.dataQuality.hasRaceResult).toBe(true);
    expect(analysis.overallStatistics.dataQuality.hasTelemetry).toBe(true);
    expect(analysis.overallStatistics.dataQuality.hasSectionData).toBe(true);
  });

  it('should analyze vehicle data queried by car number', async () => {
    const allData = {
      lapTimes: [
        { vehicle_id: 'GR86-004-46', lap: 1, value: 145000, timestamp: new Date() }
      ],
      results: [
        {
          position: 1,
          number: 46,
          laps: 1,
          total_time: '2:25.000',
          gap_first: '0.000',
          gap_previous: '0.000',
          best_lap_time: '2:25.000',
          class: 'Am'
        }
      ],
      telemetry: [],
      sections: []
    };

    // Query vehicle by car number
    const vehicleData = await queryVehicle(46, allData);
    
    // Analyze the queried data
    const analysis = analyzeVehicleData(vehicleData);

    // Verify the analysis
    expect(analysis.carNumber).toBe(46);
    expect(analysis.raceStatistics.position).toBe(1);
    expect(analysis.overallStatistics.position).toBe(1);
  });

  it('should handle non-existent vehicle gracefully', async () => {
    const allData = {
      lapTimes: [],
      results: [],
      telemetry: [],
      sections: []
    };

    // Query non-existent vehicle
    const vehicleData = await queryVehicle('NON-EXISTENT', allData);
    
    // Analyze the empty data
    const analysis = analyzeVehicleData(vehicleData);

    // Verify empty analysis
    expect(analysis.lapStatistics.totalLaps).toBe(0);
    expect(analysis.raceStatistics.position).toBeNull();
    expect(analysis.telemetryStatistics.maxSpeed).toBeNull();
    expect(analysis.overallStatistics.dataQuality.hasLapData).toBe(false);
    expect(analysis.overallStatistics.dataQuality.hasRaceResult).toBe(false);
  });
});
