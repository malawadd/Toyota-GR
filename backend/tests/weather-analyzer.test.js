import { describe, it, expect } from 'vitest';
import { analyzeWeather } from '../analyzers/weather-analyzer.js';

describe('Weather Analyzer', () => {
  it('should handle empty input', () => {
    const result = analyzeWeather([]);
    expect(result.avgAirTemp).toBeNull();
    expect(result.avgTrackTemp).toBeNull();
    expect(result.avgHumidity).toBeNull();
    expect(result.avgPressure).toBeNull();
    expect(result.avgWindSpeed).toBeNull();
    expect(result.minTemp).toBeNull();
    expect(result.maxTemp).toBeNull();
    expect(result.minWindSpeed).toBeNull();
    expect(result.maxWindSpeed).toBeNull();
    expect(result.rainPeriods.length).toBe(0);
  });

  it('should calculate average values for all weather metrics', () => {
    const weatherRecords = [
      {
        timestamp: new Date('2024-01-01T10:00:00Z'),
        air_temp: 20.0,
        track_temp: 25.0,
        humidity: 60.0,
        pressure: 1013.0,
        wind_speed: 5.0,
        wind_direction: 180.0,
        rain: 0.0
      },
      {
        timestamp: new Date('2024-01-01T10:05:00Z'),
        air_temp: 22.0,
        track_temp: 27.0,
        humidity: 58.0,
        pressure: 1012.0,
        wind_speed: 7.0,
        wind_direction: 185.0,
        rain: 0.0
      }
    ];

    const result = analyzeWeather(weatherRecords);
    
    expect(result.avgAirTemp).toBe(21.0);
    expect(result.avgTrackTemp).toBe(26.0);
    expect(result.avgHumidity).toBe(59.0);
    expect(result.avgPressure).toBe(1012.5);
    expect(result.avgWindSpeed).toBe(6.0);
  });

  it('should identify min/max temperature', () => {
    const weatherRecords = [
      {
        timestamp: new Date('2024-01-01T10:00:00Z'),
        air_temp: 18.0,
        track_temp: 23.0,
        humidity: 60.0,
        pressure: 1013.0,
        wind_speed: 5.0,
        wind_direction: 180.0,
        rain: 0.0
      },
      {
        timestamp: new Date('2024-01-01T10:05:00Z'),
        air_temp: 25.0,
        track_temp: 30.0,
        humidity: 58.0,
        pressure: 1012.0,
        wind_speed: 7.0,
        wind_direction: 185.0,
        rain: 0.0
      },
      {
        timestamp: new Date('2024-01-01T10:10:00Z'),
        air_temp: 22.0,
        track_temp: 27.0,
        humidity: 59.0,
        pressure: 1012.5,
        wind_speed: 6.0,
        wind_direction: 182.0,
        rain: 0.0
      }
    ];

    const result = analyzeWeather(weatherRecords);
    
    expect(result.minTemp).toBe(18.0);
    expect(result.maxTemp).toBe(25.0);
  });

  it('should identify min/max wind speed', () => {
    const weatherRecords = [
      {
        timestamp: new Date('2024-01-01T10:00:00Z'),
        air_temp: 20.0,
        track_temp: 25.0,
        humidity: 60.0,
        pressure: 1013.0,
        wind_speed: 3.0,
        wind_direction: 180.0,
        rain: 0.0
      },
      {
        timestamp: new Date('2024-01-01T10:05:00Z'),
        air_temp: 22.0,
        track_temp: 27.0,
        humidity: 58.0,
        pressure: 1012.0,
        wind_speed: 12.0,
        wind_direction: 185.0,
        rain: 0.0
      },
      {
        timestamp: new Date('2024-01-01T10:10:00Z'),
        air_temp: 21.0,
        track_temp: 26.0,
        humidity: 59.0,
        pressure: 1012.5,
        wind_speed: 7.0,
        wind_direction: 182.0,
        rain: 0.0
      }
    ];

    const result = analyzeWeather(weatherRecords);
    
    expect(result.minWindSpeed).toBe(3.0);
    expect(result.maxWindSpeed).toBe(12.0);
  });

  it('should flag rain periods when rain > 0', () => {
    const weatherRecords = [
      {
        timestamp: new Date('2024-01-01T10:00:00Z'),
        air_temp: 20.0,
        track_temp: 25.0,
        humidity: 60.0,
        pressure: 1013.0,
        wind_speed: 5.0,
        wind_direction: 180.0,
        rain: 0.0
      },
      {
        timestamp: new Date('2024-01-01T10:05:00Z'),
        air_temp: 19.0,
        track_temp: 24.0,
        humidity: 75.0,
        pressure: 1012.0,
        wind_speed: 8.0,
        wind_direction: 185.0,
        rain: 2.5
      },
      {
        timestamp: new Date('2024-01-01T10:10:00Z'),
        air_temp: 18.5,
        track_temp: 23.5,
        humidity: 80.0,
        pressure: 1011.5,
        wind_speed: 10.0,
        wind_direction: 190.0,
        rain: 5.0
      },
      {
        timestamp: new Date('2024-01-01T10:15:00Z'),
        air_temp: 20.0,
        track_temp: 25.0,
        humidity: 65.0,
        pressure: 1013.0,
        wind_speed: 6.0,
        wind_direction: 180.0,
        rain: 0.0
      }
    ];

    const result = analyzeWeather(weatherRecords);
    
    expect(result.rainPeriods.length).toBe(2);
    expect(result.rainPeriods[0].rain).toBe(2.5);
    expect(result.rainPeriods[0].air_temp).toBe(19.0);
    expect(result.rainPeriods[1].rain).toBe(5.0);
    expect(result.rainPeriods[1].air_temp).toBe(18.5);
  });

  it('should handle NaN values gracefully', () => {
    const weatherRecords = [
      {
        timestamp: new Date('2024-01-01T10:00:00Z'),
        air_temp: 20.0,
        track_temp: NaN,
        humidity: 60.0,
        pressure: 1013.0,
        wind_speed: 5.0,
        wind_direction: 180.0,
        rain: 0.0
      },
      {
        timestamp: new Date('2024-01-01T10:05:00Z'),
        air_temp: 22.0,
        track_temp: 27.0,
        humidity: NaN,
        pressure: 1012.0,
        wind_speed: 7.0,
        wind_direction: 185.0,
        rain: 0.0
      }
    ];

    const result = analyzeWeather(weatherRecords);
    
    expect(result.avgAirTemp).toBe(21.0);
    expect(result.avgTrackTemp).toBe(27.0); // Only one valid value
    expect(result.avgHumidity).toBe(60.0); // Only one valid value
  });
});
