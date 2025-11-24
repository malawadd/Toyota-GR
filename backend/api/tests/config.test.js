/**
 * Tests for config.js
 * Validates configuration module with environment variable support
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { config } from '../config.js';

describe('Configuration', () => {
  let originalEnv;
  
  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });
  
  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });
  
  describe('Default values', () => {
    it('should have default port of 3000', () => {
      expect(config.port).toBe(3000);
    });
    
    it('should have default host of 0.0.0.0', () => {
      expect(config.host).toBe('0.0.0.0');
    });
    
    it('should have default database path', () => {
      expect(config.dbPath).toBe('./data/racing.db');
    });
    
    it('should have cache enabled by default', () => {
      expect(config.cacheEnabled).toBe(true);
    });
    
    it('should have default cache TTL of 300 seconds', () => {
      expect(config.cacheTTL).toBe(300);
    });
    
    it('should have default CORS origins of wildcard', () => {
      expect(config.corsOrigins).toEqual(['*']);
    });
    
    it('should have default log level of info', () => {
      expect(config.logLevel).toBe('info');
    });
    
    it('should have default pagination settings', () => {
      expect(config.defaultPageSize).toBe(100);
      expect(config.maxPageSize).toBe(1000);
    });
    
    it('should have performance timeout settings', () => {
      expect(config.telemetryQueryTimeout).toBe(100);
      expect(config.statisticsQueryTimeout).toBe(50);
    });
    
    it('should have streaming enabled by default', () => {
      expect(config.streamingEnabled).toBe(true);
      expect(config.defaultPlaybackSpeed).toBe(1.0);
    });
    
    it('should detect environment from NODE_ENV', () => {
      // In test environment, NODE_ENV is set to 'test' by vitest
      expect(config.env).toBe(process.env.NODE_ENV || 'development');
      expect(config.isProduction).toBe(process.env.NODE_ENV === 'production');
      expect(config.isDevelopment).toBe(process.env.NODE_ENV !== 'production');
    });
  });
  
  describe('Configuration structure', () => {
    it('should export config object', () => {
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });
    
    it('should have all required configuration keys', () => {
      const requiredKeys = [
        'port',
        'host',
        'dbPath',
        'cacheEnabled',
        'cacheTTL',
        'corsOrigins',
        'logLevel',
        'env'
      ];
      
      requiredKeys.forEach(key => {
        expect(config).toHaveProperty(key);
      });
    });
    
    it('should have additional useful configuration keys', () => {
      const additionalKeys = [
        'cacheMaxKeys',
        'logFile',
        'defaultPageSize',
        'maxPageSize',
        'telemetryQueryTimeout',
        'statisticsQueryTimeout',
        'streamingEnabled',
        'defaultPlaybackSpeed',
        'isDevelopment',
        'isProduction'
      ];
      
      additionalKeys.forEach(key => {
        expect(config).toHaveProperty(key);
      });
    });
  });
  
  describe('Type validation', () => {
    it('should have numeric types for port and timeouts', () => {
      expect(typeof config.port).toBe('number');
      expect(typeof config.cacheTTL).toBe('number');
      expect(typeof config.cacheMaxKeys).toBe('number');
      expect(typeof config.defaultPageSize).toBe('number');
      expect(typeof config.maxPageSize).toBe('number');
      expect(typeof config.telemetryQueryTimeout).toBe('number');
      expect(typeof config.statisticsQueryTimeout).toBe('number');
    });
    
    it('should have boolean types for flags', () => {
      expect(typeof config.cacheEnabled).toBe('boolean');
      expect(typeof config.streamingEnabled).toBe('boolean');
      expect(typeof config.isDevelopment).toBe('boolean');
      expect(typeof config.isProduction).toBe('boolean');
    });
    
    it('should have string types for paths and levels', () => {
      expect(typeof config.host).toBe('string');
      expect(typeof config.dbPath).toBe('string');
      expect(typeof config.logLevel).toBe('string');
      expect(typeof config.logFile).toBe('string');
      expect(typeof config.env).toBe('string');
    });
    
    it('should have array type for CORS origins', () => {
      expect(Array.isArray(config.corsOrigins)).toBe(true);
    });
    
    it('should have numeric type for playback speed', () => {
      expect(typeof config.defaultPlaybackSpeed).toBe('number');
    });
  });
  
  describe('Value validation', () => {
    it('should have positive numeric values', () => {
      expect(config.port).toBeGreaterThan(0);
      expect(config.cacheTTL).toBeGreaterThan(0);
      expect(config.cacheMaxKeys).toBeGreaterThan(0);
      expect(config.defaultPageSize).toBeGreaterThan(0);
      expect(config.maxPageSize).toBeGreaterThan(0);
      expect(config.telemetryQueryTimeout).toBeGreaterThan(0);
      expect(config.statisticsQueryTimeout).toBeGreaterThan(0);
    });
    
    it('should have valid log level', () => {
      const validLogLevels = ['error', 'warn', 'info', 'debug', 'verbose'];
      expect(validLogLevels).toContain(config.logLevel);
    });
    
    it('should have valid playback speed', () => {
      expect(config.defaultPlaybackSpeed).toBeGreaterThan(0);
    });
    
    it('should have max page size greater than default', () => {
      expect(config.maxPageSize).toBeGreaterThanOrEqual(config.defaultPageSize);
    });
  });
});
