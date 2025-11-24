import { describe, it, expect } from 'vitest';
import { analyzeVehicleData } from '../analyzers/vehicle-analyzer.js';

describe('Vehicle Analyzer', () => {
  describe('analyzeVehicleData', () => {
    it('should return empty statistics for vehicle with no data', () => {
      const vehicleData = {
        vehicleId: 'GR86-004-78',
        carNumber: 78,
        class: 'Am',
        lapTimes: [],
        raceResult: null,
        telemetry: [],
        sections: []
      };

      const result = analyzeVehicleData(vehicleData);

      expect(result.vehicleId).toBe('GR86-004-78');
      expect(result.carNumber).toBe(78);
      expect(result.class).toBe('Am');
      expect(result.lapStatistics.totalLaps).toBe(0);
      expect(result.lapStatistics.fastestLap).toBeNull();
      expect(result.raceStatistics.position).toBeNull();
      expect(result.telemetryStatistics.maxSpeed).toBeNull();
      expect(result.overallStatistics.fastestLap).toBeNull();
    });

    it('should calculate lap statistics correctly', () => {
      const vehicleData = {
        vehicleId: 'GR86-004-78',
        carNumber: 78,
        class: 'Am',
        lapTimes: [
          { vehicle_id: 'GR86-004-78', lap: 1, value: 150000 },
          { vehicle_id: 'GR86-004-78', lap: 2, value: 148000 },
          { vehicle_id: 'GR86-004-78', lap: 3, value: 149000 }
        ],
        raceResult: null,
        telemetry: [],
        sections: []
      };

      const result = analyzeVehicleData(vehicleData);

      expect(result.lapStatistics.totalLaps).toBe(3);
      expect(result.lapStatistics.fastestLap).toBe(148000);
      expect(result.lapStatistics.slowestLap).toBe(150000);
      expect(result.lapStatistics.averageLap).toBe(149000);
      expect(result.lapStatistics.stdDev).toBeGreaterThan(0);
      expect(result.overallStatistics.fastestLap).toBe(148000);
      expect(result.overallStatistics.totalLaps).toBe(3);
    });

    it('should calculate race statistics correctly', () => {
      const vehicleData = {
        vehicleId: 'GR86-004-78',
        carNumber: 78,
        class: 'Am',
        lapTimes: [],
        raceResult: {
          position: 5,
          number: 78,
          laps: 25,
          total_time: '1:02:30.456',
          gap_first: '+15.234',
          gap_previous: '+2.456',
          best_lap_time: '2:28.630',
          class: 'Am'
        },
        telemetry: [],
        sections: []
      };

      const result = analyzeVehicleData(vehicleData);

      expect(result.raceStatistics.position).toBe(5);
      expect(result.raceStatistics.totalLaps).toBe(25);
      expect(result.raceStatistics.totalTime).toBe('1:02:30.456');
      expect(result.raceStatistics.gapToFirst).toBe('+15.234');
      expect(result.overallStatistics.position).toBe(5);
    });

    it('should calculate telemetry statistics correctly', () => {
      const vehicleData = {
        vehicleId: 'GR86-004-78',
        carNumber: 78,
        class: 'Am',
        lapTimes: [],
        raceResult: null,
        telemetry: [
          { vehicle_id: 'GR86-004-78', telemetry_name: 'vCar', telemetry_value: 180.5 },
          { vehicle_id: 'GR86-004-78', telemetry_name: 'vCar', telemetry_value: 185.2 },
          { vehicle_id: 'GR86-004-78', telemetry_name: 'vCar', telemetry_value: 175.8 },
          { vehicle_id: 'GR86-004-78', telemetry_name: 'brake_front', telemetry_value: 85.5 },
          { vehicle_id: 'GR86-004-78', telemetry_name: 'brake_rear', telemetry_value: 65.2 }
        ],
        sections: []
      };

      const result = analyzeVehicleData(vehicleData);

      expect(result.telemetryStatistics.maxSpeed).toBe(185.2);
      expect(result.telemetryStatistics.minSpeed).toBe(175.8);
      expect(result.telemetryStatistics.avgSpeed).toBeCloseTo(180.5, 1);
      expect(result.telemetryStatistics.maxBrakeFront).toBe(85.5);
      expect(result.telemetryStatistics.maxBrakeRear).toBe(65.2);
      expect(result.telemetryStatistics.dataPoints).toBe(5);
      expect(result.overallStatistics.maxSpeed).toBe(185.2);
    });

    it('should calculate section statistics correctly', () => {
      const vehicleData = {
        vehicleId: 'GR86-004-78',
        carNumber: 78,
        class: 'Am',
        lapTimes: [],
        raceResult: null,
        telemetry: [],
        sections: [
          { number: 78, lap_number: 1, s1: '0:35.123', s2: '0:42.456', s3: '0:38.789', top_speed: 185.5 },
          { number: 78, lap_number: 2, s1: '0:34.987', s2: '0:42.123', s3: '0:38.456', top_speed: 186.2 },
          { number: 78, lap_number: 3, s1: '0:35.456', s2: '0:42.789', s3: '0:38.234', top_speed: 184.8 }
        ]
      };

      const result = analyzeVehicleData(vehicleData);

      expect(result.sectionStatistics.s1.fastest).toBeLessThan(35000);
      expect(result.sectionStatistics.s1.count).toBe(3);
      expect(result.sectionStatistics.s2.fastest).toBeLessThan(43000);
      expect(result.sectionStatistics.s2.count).toBe(3);
      expect(result.sectionStatistics.s3.fastest).toBeLessThan(39000);
      expect(result.sectionStatistics.s3.count).toBe(3);
      expect(result.sectionStatistics.topSpeed).toBe(186.2);
    });

    it('should calculate overall statistics combining all data', () => {
      const vehicleData = {
        vehicleId: 'GR86-004-78',
        carNumber: 78,
        class: 'Am',
        lapTimes: [
          { vehicle_id: 'GR86-004-78', lap: 1, value: 150000 },
          { vehicle_id: 'GR86-004-78', lap: 2, value: 148000 }
        ],
        raceResult: {
          position: 3,
          number: 78,
          laps: 2,
          total_time: '5:00.000',
          gap_first: '+5.000',
          gap_previous: '+1.000',
          best_lap_time: '2:28.000',
          class: 'Am'
        },
        telemetry: [
          { vehicle_id: 'GR86-004-78', telemetry_name: 'vCar', telemetry_value: 180.5 }
        ],
        sections: [
          { number: 78, lap_number: 1, s1: '0:35.123', s2: '0:42.456', s3: '0:38.789', top_speed: 185.5 }
        ]
      };

      const result = analyzeVehicleData(vehicleData);

      expect(result.overallStatistics.fastestLap).toBe(148000);
      expect(result.overallStatistics.averageLap).toBe(149000);
      expect(result.overallStatistics.totalLaps).toBe(2);
      expect(result.overallStatistics.maxSpeed).toBe(180.5);
      expect(result.overallStatistics.position).toBe(3);
      expect(result.overallStatistics.dataQuality.hasLapData).toBe(true);
      expect(result.overallStatistics.dataQuality.hasRaceResult).toBe(true);
      expect(result.overallStatistics.dataQuality.hasTelemetry).toBe(true);
      expect(result.overallStatistics.dataQuality.hasSectionData).toBe(true);
    });

    it('should handle missing or null data gracefully', () => {
      const vehicleData = {
        vehicleId: null,
        carNumber: null,
        class: null,
        lapTimes: [],
        raceResult: null,
        telemetry: [],
        sections: []
      };

      const result = analyzeVehicleData(vehicleData);

      expect(result.vehicleId).toBeNull();
      expect(result.carNumber).toBeNull();
      expect(result.class).toBeNull();
      expect(result.overallStatistics.dataQuality.hasLapData).toBe(false);
      expect(result.overallStatistics.dataQuality.hasRaceResult).toBe(false);
      expect(result.overallStatistics.dataQuality.hasTelemetry).toBe(false);
      expect(result.overallStatistics.dataQuality.hasSectionData).toBe(false);
    });
  });
});
