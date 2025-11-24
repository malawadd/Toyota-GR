/**
 * Weather Routes Tests
 * Integration tests for weather API endpoints
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { initializeDatabase, closeDatabase } from '../database/init.js';
import { CacheManager } from '../cache/cache-manager.js';
import weatherRoutes from '../routes/weather.js';
import { errorHandler } from '../middleware/error-handler.js';

describe('Weather Routes', () => {
  let app;
  let db;
  let cache;

  beforeEach(() => {
    // Create in-memory database for testing
    db = initializeDatabase(':memory:', { memory: true });
    
    // Create cache manager
    cache = new CacheManager(300);

    // Set up Express app
    app = express();
    app.use(express.json());
    
    // Make db and cache available to routes
    app.locals.db = db;
    app.locals.cache = cache;
    
    // Register routes
    app.use('/api/weather', weatherRoutes);
    
    // Register error handler
    app.use(errorHandler);
  });

  afterEach(() => {
    closeDatabase(db);
    cache.flush();
  });

  /**
   * Helper function to insert test weather data
   */
  function insertWeather(weatherData) {
    const stmt = db.prepare(`
      INSERT INTO weather (timestamp, air_temp, track_temp, humidity, pressure, wind_speed, wind_direction, rain)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const weather of weatherData) {
      stmt.run(
        weather.timestamp,
        weather.air_temp,
        weather.track_temp,
        weather.humidity,
        weather.pressure,
        weather.wind_speed,
        weather.wind_direction,
        weather.rain
      );
    }
  }

  describe('GET /api/weather', () => {
    // Example 13: Weather data endpoint
    // Validates: Requirements 8.1
    it('should return weather measurements with timestamps', async () => {
      const weatherData = [
        { 
          timestamp: '2024-03-15T14:00:00.000Z', 
          air_temp: 25.5, 
          track_temp: 35.2, 
          humidity: 45.0, 
          pressure: 1013.25, 
          wind_speed: 5.5, 
          wind_direction: 180.0, 
          rain: 0.0 
        },
        { 
          timestamp: '2024-03-15T14:05:00.000Z', 
          air_temp: 25.8, 
          track_temp: 35.5, 
          humidity: 44.5, 
          pressure: 1013.20, 
          wind_speed: 6.0, 
          wind_direction: 185.0, 
          rain: 0.0 
        }
      ];
      insertWeather(weatherData);

      const response = await request(app)
        .get('/api/weather')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.total).toBe(2);
      
      // Verify timestamps are included
      expect(response.body.data[0].timestamp).toBeDefined();
      expect(response.body.data[1].timestamp).toBeDefined();
    });

    it('should filter weather by time range', async () => {
      const weatherData = [
        { timestamp: '2024-03-15T14:00:00.000Z', air_temp: 25.5, track_temp: 35.2, humidity: 45.0, pressure: 1013.25, wind_speed: 5.5, wind_direction: 180.0, rain: 0.0 },
        { timestamp: '2024-03-15T14:05:00.000Z', air_temp: 25.8, track_temp: 35.5, humidity: 44.5, pressure: 1013.20, wind_speed: 6.0, wind_direction: 185.0, rain: 0.0 },
        { timestamp: '2024-03-15T14:10:00.000Z', air_temp: 26.0, track_temp: 35.8, humidity: 44.0, pressure: 1013.15, wind_speed: 6.5, wind_direction: 190.0, rain: 0.0 }
      ];
      insertWeather(weatherData);

      const response = await request(app)
        .get('/api/weather?startTime=2024-03-15T14:05:00.000Z&endTime=2024-03-15T14:10:00.000Z')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].timestamp).toBe('2024-03-15T14:05:00.000Z');
      expect(response.body.data[1].timestamp).toBe('2024-03-15T14:10:00.000Z');
    });

    it('should paginate weather data', async () => {
      const weatherData = [];
      for (let i = 0; i < 150; i++) {
        weatherData.push({
          timestamp: `2024-03-15T${String(14 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00.000Z`,
          air_temp: 25.0 + i * 0.1,
          track_temp: 35.0 + i * 0.1,
          humidity: 45.0,
          pressure: 1013.25,
          wind_speed: 5.5,
          wind_direction: 180.0,
          rain: 0.0
        });
      }
      insertWeather(weatherData);

      const response = await request(app)
        .get('/api/weather?page=2&limit=50')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(50);
      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.limit).toBe(50);
      expect(response.body.meta.total).toBe(150);
      expect(response.body.meta.totalPages).toBe(3);
      expect(response.body.meta.hasNext).toBe(true);
      expect(response.body.meta.hasPrev).toBe(true);
    });

    it('should return 400 for invalid time range', async () => {
      const response = await request(app)
        .get('/api/weather?startTime=2024-03-15T14:10:00.000Z&endTime=2024-03-15T14:05:00.000Z')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TIME_RANGE');
    });

    it('should return 400 for invalid timestamp format', async () => {
      const response = await request(app)
        .get('/api/weather?startTime=invalid-timestamp')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return empty array when no weather data exists', async () => {
      const response = await request(app)
        .get('/api/weather')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });
  });

  describe('GET /api/weather/range', () => {
    it('should return weather for specific time range', async () => {
      const weatherData = [
        { timestamp: '2024-03-15T14:00:00.000Z', air_temp: 25.5, track_temp: 35.2, humidity: 45.0, pressure: 1013.25, wind_speed: 5.5, wind_direction: 180.0, rain: 0.0 },
        { timestamp: '2024-03-15T14:05:00.000Z', air_temp: 25.8, track_temp: 35.5, humidity: 44.5, pressure: 1013.20, wind_speed: 6.0, wind_direction: 185.0, rain: 0.0 },
        { timestamp: '2024-03-15T14:10:00.000Z', air_temp: 26.0, track_temp: 35.8, humidity: 44.0, pressure: 1013.15, wind_speed: 6.5, wind_direction: 190.0, rain: 0.0 }
      ];
      insertWeather(weatherData);

      const response = await request(app)
        .get('/api/weather/range?startTime=2024-03-15T14:05:00.000Z&endTime=2024-03-15T14:10:00.000Z')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.meta.timeRange).toBeDefined();
      expect(response.body.meta.timeRange.start).toBe('2024-03-15T14:05:00.000Z');
      expect(response.body.meta.timeRange.end).toBe('2024-03-15T14:10:00.000Z');
    });

    it('should return 400 when startTime is missing', async () => {
      const response = await request(app)
        .get('/api/weather/range?endTime=2024-03-15T14:10:00.000Z')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when endTime is missing', async () => {
      const response = await request(app)
        .get('/api/weather/range?startTime=2024-03-15T14:00:00.000Z')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid time range', async () => {
      const response = await request(app)
        .get('/api/weather/range?startTime=2024-03-15T14:10:00.000Z&endTime=2024-03-15T14:05:00.000Z')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TIME_RANGE');
    });
  });

  describe('GET /api/weather/summary', () => {
    // Example 14: Weather summary
    // Validates: Requirements 8.3
    it('should return aggregated weather statistics', async () => {
      const weatherData = [
        { timestamp: '2024-03-15T14:00:00.000Z', air_temp: 25.0, track_temp: 35.0, humidity: 45.0, pressure: 1013.25, wind_speed: 5.0, wind_direction: 180.0, rain: 0.0 },
        { timestamp: '2024-03-15T14:05:00.000Z', air_temp: 26.0, track_temp: 36.0, humidity: 44.0, pressure: 1013.20, wind_speed: 6.0, wind_direction: 185.0, rain: 0.0 },
        { timestamp: '2024-03-15T14:10:00.000Z', air_temp: 27.0, track_temp: 37.0, humidity: 43.0, pressure: 1013.15, wind_speed: 7.0, wind_direction: 190.0, rain: 0.5 }
      ];
      insertWeather(weatherData);

      const response = await request(app)
        .get('/api/weather/summary')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.count).toBe(3);
      expect(response.body.data.airTemp).toBeDefined();
      expect(response.body.data.airTemp.average).toBeCloseTo(26.0, 1);
      expect(response.body.data.airTemp.min).toBe(25.0);
      expect(response.body.data.airTemp.max).toBe(27.0);
      expect(response.body.data.trackTemp).toBeDefined();
      expect(response.body.data.humidity).toBeDefined();
      expect(response.body.data.pressure).toBeDefined();
      expect(response.body.data.wind).toBeDefined();
      expect(response.body.data.rain).toBeDefined();
      expect(response.body.data.rain.measurements).toBe(1);
    });

    it('should filter summary by time range', async () => {
      const weatherData = [
        { timestamp: '2024-03-15T14:00:00.000Z', air_temp: 25.0, track_temp: 35.0, humidity: 45.0, pressure: 1013.25, wind_speed: 5.0, wind_direction: 180.0, rain: 0.0 },
        { timestamp: '2024-03-15T14:05:00.000Z', air_temp: 26.0, track_temp: 36.0, humidity: 44.0, pressure: 1013.20, wind_speed: 6.0, wind_direction: 185.0, rain: 0.0 },
        { timestamp: '2024-03-15T14:10:00.000Z', air_temp: 27.0, track_temp: 37.0, humidity: 43.0, pressure: 1013.15, wind_speed: 7.0, wind_direction: 190.0, rain: 0.5 }
      ];
      insertWeather(weatherData);

      const response = await request(app)
        .get('/api/weather/summary?startTime=2024-03-15T14:05:00.000Z')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(2);
      expect(response.body.meta.timeRange).toBeDefined();
    });

    it('should cache weather summary', async () => {
      const weatherData = [
        { timestamp: '2024-03-15T14:00:00.000Z', air_temp: 25.0, track_temp: 35.0, humidity: 45.0, pressure: 1013.25, wind_speed: 5.0, wind_direction: 180.0, rain: 0.0 }
      ];
      insertWeather(weatherData);

      // First request
      await request(app).get('/api/weather/summary').expect(200);
      
      const statsAfterFirst = cache.getStats();
      expect(statsAfterFirst.sets).toBeGreaterThan(0);

      // Second request - should hit cache
      await request(app).get('/api/weather/summary').expect(200);
      
      const statsAfterSecond = cache.getStats();
      expect(statsAfterSecond.hits).toBeGreaterThan(0);
    });

    it('should return 404 when no weather data exists', async () => {
      const response = await request(app)
        .get('/api/weather/summary')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_WEATHER_DATA');
    });

    it('should return 400 for invalid time range', async () => {
      const response = await request(app)
        .get('/api/weather/summary?startTime=2024-03-15T14:10:00.000Z&endTime=2024-03-15T14:05:00.000Z')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TIME_RANGE');
    });
  });

  describe('GET /api/weather/rain', () => {
    it('should return rain periods', async () => {
      const weatherData = [
        { timestamp: '2024-03-15T14:00:00.000Z', air_temp: 25.0, track_temp: 35.0, humidity: 45.0, pressure: 1013.25, wind_speed: 5.0, wind_direction: 180.0, rain: 0.0 },
        { timestamp: '2024-03-15T14:05:00.000Z', air_temp: 24.0, track_temp: 34.0, humidity: 60.0, pressure: 1013.20, wind_speed: 8.0, wind_direction: 185.0, rain: 2.5 },
        { timestamp: '2024-03-15T14:10:00.000Z', air_temp: 23.5, track_temp: 33.5, humidity: 65.0, pressure: 1013.15, wind_speed: 9.0, wind_direction: 190.0, rain: 3.0 },
        { timestamp: '2024-03-15T14:30:00.000Z', air_temp: 25.0, track_temp: 35.0, humidity: 50.0, pressure: 1013.25, wind_speed: 6.0, wind_direction: 180.0, rain: 0.0 }
      ];
      insertWeather(weatherData);

      const response = await request(app)
        .get('/api/weather/rain')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].startTime).toBeDefined();
      expect(response.body.data[0].endTime).toBeDefined();
      expect(response.body.data[0].maxIntensity).toBeDefined();
    });

    it('should filter rain by minimum intensity', async () => {
      const weatherData = [
        { timestamp: '2024-03-15T14:00:00.000Z', air_temp: 25.0, track_temp: 35.0, humidity: 45.0, pressure: 1013.25, wind_speed: 5.0, wind_direction: 180.0, rain: 0.5 },
        { timestamp: '2024-03-15T14:05:00.000Z', air_temp: 24.0, track_temp: 34.0, humidity: 60.0, pressure: 1013.20, wind_speed: 8.0, wind_direction: 185.0, rain: 2.5 }
      ];
      insertWeather(weatherData);

      const response = await request(app)
        .get('/api/weather/rain?minRain=2.0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.minRain).toBe(2.0);
    });

    it('should return empty array when no rain occurred', async () => {
      const weatherData = [
        { timestamp: '2024-03-15T14:00:00.000Z', air_temp: 25.0, track_temp: 35.0, humidity: 45.0, pressure: 1013.25, wind_speed: 5.0, wind_direction: 180.0, rain: 0.0 }
      ];
      insertWeather(weatherData);

      const response = await request(app)
        .get('/api/weather/rain')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });
  });

  describe('GET /api/weather/at-time', () => {
    it('should return nearest weather measurement', async () => {
      const weatherData = [
        { timestamp: '2024-03-15T14:00:00.000Z', air_temp: 25.0, track_temp: 35.0, humidity: 45.0, pressure: 1013.25, wind_speed: 5.0, wind_direction: 180.0, rain: 0.0 },
        { timestamp: '2024-03-15T14:05:00.000Z', air_temp: 26.0, track_temp: 36.0, humidity: 44.0, pressure: 1013.20, wind_speed: 6.0, wind_direction: 185.0, rain: 0.0 },
        { timestamp: '2024-03-15T14:10:00.000Z', air_temp: 27.0, track_temp: 37.0, humidity: 43.0, pressure: 1013.15, wind_speed: 7.0, wind_direction: 190.0, rain: 0.0 }
      ];
      insertWeather(weatherData);

      const response = await request(app)
        .get('/api/weather/at-time?time=2024-03-15T14:07:00.000Z')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.meta.targetTime).toBe('2024-03-15T14:07:00.000Z');
    });

    it('should return 400 when time parameter is missing', async () => {
      const response = await request(app)
        .get('/api/weather/at-time')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid timestamp format', async () => {
      const response = await request(app)
        .get('/api/weather/at-time?time=invalid-timestamp')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 when no weather data exists', async () => {
      const response = await request(app)
        .get('/api/weather/at-time?time=2024-03-15T14:00:00.000Z')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_WEATHER_DATA');
    });
  });
});
