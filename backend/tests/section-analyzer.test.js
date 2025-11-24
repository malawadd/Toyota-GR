import { describe, it, expect } from 'vitest';
import { analyzeSections } from '../analyzers/section-analyzer.js';

describe('Section Analyzer', () => {
  it('should handle empty input', () => {
    const result = analyzeSections([]);
    expect(result.fastestBySection.size).toBe(0);
    expect(result.avgBySection.size).toBe(0);
    expect(result.fastestVehicleBySection.size).toBe(0);
  });

  it('should calculate fastest time per section', () => {
    const sectionRecords = [
      {
        number: 3,
        lap_number: 1,
        lap_time: '2:36.896',
        s1: '0:33.659',
        s2: '1:01.873',
        s3: '1:01.364',
        top_speed: 200.0
      },
      {
        number: 3,
        lap_number: 2,
        lap_time: '2:33.653',
        s1: '0:33.486',
        s2: '0:58.603',
        s3: '1:01.564',
        top_speed: 201.5
      },
      {
        number: 11,
        lap_number: 1,
        lap_time: '2:32.202',
        s1: '0:33.813',
        s2: '0:58.094',
        s3: '1:00.295',
        top_speed: 206.1
      }
    ];

    const result = analyzeSections(sectionRecords);
    
    // S1: fastest is 33.486 seconds = 33486 ms
    expect(result.fastestBySection.get('S1')).toBe(33486);
    // S2: fastest is 58.094 seconds = 58094 ms
    expect(result.fastestBySection.get('S2')).toBe(58094);
    // S3: fastest is 60.295 seconds = 60295 ms
    expect(result.fastestBySection.get('S3')).toBe(60295);
  });

  it('should calculate average time per section', () => {
    const sectionRecords = [
      {
        number: 3,
        lap_number: 1,
        lap_time: '2:30.000',
        s1: '0:30.000',
        s2: '1:00.000',
        s3: '1:00.000',
        top_speed: 200.0
      },
      {
        number: 3,
        lap_number: 2,
        lap_time: '2:30.000',
        s1: '0:40.000',
        s2: '1:00.000',
        s3: '0:50.000',
        top_speed: 200.0
      }
    ];

    const result = analyzeSections(sectionRecords);
    
    // S1: average of 30000 and 40000 = 35000 ms
    expect(result.avgBySection.get('S1')).toBe(35000);
    // S2: average of 60000 and 60000 = 60000 ms
    expect(result.avgBySection.get('S2')).toBe(60000);
    // S3: average of 60000 and 50000 = 55000 ms
    expect(result.avgBySection.get('S3')).toBe(55000);
  });

  it('should identify fastest vehicle per section', () => {
    const sectionRecords = [
      {
        number: 3,
        lap_number: 1,
        lap_time: '2:36.896',
        s1: '0:33.659',
        s2: '1:01.873',
        s3: '1:01.364',
        top_speed: 200.0
      },
      {
        number: 11,
        lap_number: 1,
        lap_time: '2:32.202',
        s1: '0:33.813',
        s2: '0:58.094',
        s3: '1:00.295',
        top_speed: 206.1
      },
      {
        number: 13,
        lap_number: 1,
        lap_time: '2:29.930',
        s1: '0:32.769',
        s2: '0:57.341',
        s3: '0:59.820',
        top_speed: 204.5
      }
    ];

    const result = analyzeSections(sectionRecords);
    
    // Vehicle 13 has fastest S1 (32.769)
    expect(result.fastestVehicleBySection.get('S1').vehicle).toBe(13);
    expect(result.fastestVehicleBySection.get('S1').time).toBe(32769);
    
    // Vehicle 13 has fastest S2 (57.341)
    expect(result.fastestVehicleBySection.get('S2').vehicle).toBe(13);
    expect(result.fastestVehicleBySection.get('S2').time).toBe(57341);
    
    // Vehicle 13 has fastest S3 (59.820)
    expect(result.fastestVehicleBySection.get('S3').vehicle).toBe(13);
    expect(result.fastestVehicleBySection.get('S3').time).toBe(59820);
  });

  it('should handle multiple laps per vehicle', () => {
    const sectionRecords = [
      {
        number: 3,
        lap_number: 1,
        lap_time: '2:36.896',
        s1: '0:35.000',
        s2: '1:01.873',
        s3: '1:01.364',
        top_speed: 200.0
      },
      {
        number: 3,
        lap_number: 2,
        lap_time: '2:33.653',
        s1: '0:33.486',
        s2: '0:58.603',
        s3: '1:01.564',
        top_speed: 201.5
      },
      {
        number: 3,
        lap_number: 3,
        lap_time: '2:33.941',
        s1: '0:33.822',
        s2: '0:59.473',
        s3: '1:00.646',
        top_speed: 197.1
      }
    ];

    const result = analyzeSections(sectionRecords);
    
    // Should use the fastest lap from vehicle 3
    expect(result.fastestBySection.get('S1')).toBe(33486);
    expect(result.fastestVehicleBySection.get('S1').vehicle).toBe(3);
  });

  it('should handle empty or invalid section times', () => {
    const sectionRecords = [
      {
        number: 3,
        lap_number: 1,
        lap_time: '2:36.896',
        s1: '',
        s2: '1:01.873',
        s3: '1:01.364',
        top_speed: 200.0
      },
      {
        number: 11,
        lap_number: 1,
        lap_time: '2:32.202',
        s1: '0:33.813',
        s2: '',
        s3: '1:00.295',
        top_speed: 206.1
      }
    ];

    const result = analyzeSections(sectionRecords);
    
    // S1 should only have one valid time
    expect(result.fastestBySection.get('S1')).toBe(33813);
    // S2 should only have one valid time
    expect(result.fastestBySection.get('S2')).toBe(61873);
  });

  it('should parse time strings correctly', () => {
    const sectionRecords = [
      {
        number: 3,
        lap_number: 1,
        lap_time: '2:36.896',
        s1: '0:33.659',
        s2: '1:01.873',
        s3: '1:01.364',
        top_speed: 200.0
      }
    ];

    const result = analyzeSections(sectionRecords);
    
    // 0:33.659 = 33.659 seconds = 33659 ms
    expect(result.fastestBySection.get('S1')).toBe(33659);
    // 1:01.873 = 61.873 seconds = 61873 ms
    expect(result.fastestBySection.get('S2')).toBe(61873);
    // 1:01.364 = 61.364 seconds = 61364 ms
    expect(result.fastestBySection.get('S3')).toBe(61364);
  });
});
