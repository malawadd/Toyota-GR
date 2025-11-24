/**
 * Tests for server.js
 * Validates server startup, configuration, and graceful shutdown
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { startServer, gracefulShutdown } from '../server.js';
import fs from 'fs';
import path from 'path';

describe('Server', () => {
  let app;
  let consoleLogSpy;
  let testDbPath;
  
  beforeEach(() => {
    // Create a unique test database path
    testDbPath = path.join(process.cwd(), 'api', 'tests', `test-server-${Date.now()}.db`);
    
    // Spy on console.log to capture startup logging
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  afterEach(async () => {
    // Restore console.log
    consoleLogSpy.mockRestore();
    
    // Shutdown server
    if (app) {
      await gracefulShutdown();
    }
    
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });
  
  describe('Example 17: Startup logging', () => {
    /**
     * Example 17: Startup logging
     * Validates: Requirements 11.4
     * 
     * When the API starts, logs should include startup time and configuration
     */
    it('should log startup time and configuration when server starts', async () => {
      // Start server with test configuration
      app = await startServer({
        port: 0, // Use random available port
        dbPath: testDbPath,
        cacheEnabled: true,
        corsOrigins: ['http://localhost:3000'],
        env: 'test'
      });
      
      // Verify startup logging occurred
      expect(consoleLogSpy).toHaveBeenCalled();
      
      // Check for key startup messages
      const logCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const logOutput = logCalls.join('\n');
      
      // Should log that server is starting
      expect(logOutput).toContain('Starting Racing Data API');
      
      // Should log environment configuration
      expect(logOutput).toContain('Environment: test');
      
      // Should log database path
      expect(logOutput).toContain('Database:');
      
      // Should log cache status
      expect(logOutput).toContain('Cache enabled: true');
      
      // Should log CORS origins
      expect(logOutput).toContain('CORS origins:');
      
      // Should log database initialization
      expect(logOutput).toContain('Initializing database');
      expect(logOutput).toContain('Database initialized');
      
      // Should log cache initialization
      expect(logOutput).toContain('Initializing cache');
      expect(logOutput).toContain('Cache initialized');
      
      // Should log server startup completion with timing
      expect(logOutput).toContain('Server started in');
      expect(logOutput).toMatch(/Server started in \d+ms/);
      
      // Should log listening address
      expect(logOutput).toContain('Listening on');
    });
    
    it('should log configuration details on startup', async () => {
      const testConfig = {
        port: 0,
        dbPath: testDbPath,
        cacheEnabled: false,
        corsOrigins: ['http://example.com', 'http://test.com'],
        env: 'production'
      };
      
      app = await startServer(testConfig);
      
      const logCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const logOutput = logCalls.join('\n');
      
      // Should log production environment
      expect(logOutput).toContain('Environment: production');
      
      // Should log cache disabled
      expect(logOutput).toContain('Cache enabled: false');
      
      // Should log CORS origins
      expect(logOutput).toContain('http://example.com');
      expect(logOutput).toContain('http://test.com');
    });
    
    it('should log cache pre-warming when cache is enabled', async () => {
      app = await startServer({
        port: 0,
        dbPath: testDbPath,
        cacheEnabled: true,
        env: 'test'
      });
      
      const logCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const logOutput = logCalls.join('\n');
      
      // Should log cache pre-warming
      expect(logOutput).toContain('Pre-warming cache');
      expect(logOutput).toContain('Cache pre-warmed');
    });
    
    it('should not log cache operations when cache is disabled', async () => {
      app = await startServer({
        port: 0,
        dbPath: testDbPath,
        cacheEnabled: false,
        env: 'test'
      });
      
      const logCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const logOutput = logCalls.join('\n');
      
      // Should not log cache initialization
      expect(logOutput).not.toContain('Initializing cache');
      expect(logOutput).not.toContain('Pre-warming cache');
    });
  });
  
  describe('Server initialization', () => {
    it('should initialize database connection', async () => {
      app = await startServer({
        port: 0,
        dbPath: testDbPath,
        env: 'test'
      });
      
      // Verify database file was created
      expect(fs.existsSync(testDbPath)).toBe(true);
      
      // Verify app has database in locals
      expect(app.locals.db).toBeDefined();
    });
    
    it('should initialize cache when enabled', async () => {
      app = await startServer({
        port: 0,
        dbPath: testDbPath,
        cacheEnabled: true,
        env: 'test'
      });
      
      // Verify app has cache in locals
      expect(app.locals.cache).toBeDefined();
      expect(app.locals.cache.get).toBeDefined();
      expect(app.locals.cache.set).toBeDefined();
    });
    
    it('should not initialize cache when disabled', async () => {
      app = await startServer({
        port: 0,
        dbPath: testDbPath,
        cacheEnabled: false,
        env: 'test'
      });
      
      // Verify app does not have cache
      expect(app.locals.cache).toBeNull();
    });
    
    it('should store configuration in app locals', async () => {
      const testConfig = {
        port: 0,
        dbPath: testDbPath,
        cacheEnabled: true,
        cacheTTL: 600,
        env: 'test'
      };
      
      app = await startServer(testConfig);
      
      // Verify config is stored
      expect(app.locals.config).toBeDefined();
      expect(app.locals.config.cacheTTL).toBe(600);
    });
  });
  
  describe('Route registration', () => {
    it('should register all API routes', async () => {
      app = await startServer({
        port: 0,
        dbPath: testDbPath,
        env: 'test'
      });
      
      // Check that routes are registered by examining the app stack
      const routes = [];
      app._router.stack.forEach((middleware) => {
        if (middleware.route) {
          routes.push(middleware.route.path);
        } else if (middleware.name === 'router') {
          middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
              routes.push(handler.route.path);
            }
          });
        }
      });
      
      // Verify root route exists
      expect(routes).toContain('/');
    });
    
    it('should have root endpoint that returns API information', async () => {
      app = await startServer({
        port: 0,
        dbPath: testDbPath,
        env: 'test'
      });
      
      // Make request to root endpoint
      const request = (await import('supertest')).default;
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Racing Data API');
      expect(response.body.endpoints).toBeDefined();
      expect(response.body.endpoints.vehicles).toBe('/api/vehicles');
      expect(response.body.endpoints.telemetry).toBe('/api/telemetry');
    });
  });
  
  describe('Middleware registration', () => {
    it('should register CORS middleware', async () => {
      app = await startServer({
        port: 0,
        dbPath: testDbPath,
        corsOrigins: ['http://localhost:3000'],
        env: 'test'
      });
      
      // Check middleware stack for CORS
      const middlewareNames = app._router.stack.map(layer => layer.name);
      expect(middlewareNames).toContain('corsMiddleware');
    });
    
    it('should register JSON body parser', async () => {
      app = await startServer({
        port: 0,
        dbPath: testDbPath,
        env: 'test'
      });
      
      // Check middleware stack for JSON parser
      const middlewareNames = app._router.stack.map(layer => layer.name);
      expect(middlewareNames).toContain('jsonParser');
    });
    
    it('should register error handler as last middleware', async () => {
      app = await startServer({
        port: 0,
        dbPath: testDbPath,
        env: 'test'
      });
      
      // Error handler should be last in the stack
      const lastMiddleware = app._router.stack[app._router.stack.length - 1];
      expect(lastMiddleware.name).toBe('errorHandler');
    });
  });
  
  describe('Graceful shutdown', () => {
    it('should close database connection on shutdown', async () => {
      app = await startServer({
        port: 0,
        dbPath: testDbPath,
        env: 'test'
      });
      
      const db = app.locals.db;
      expect(db.open).toBe(true);
      
      await gracefulShutdown();
      
      // Database should be closed
      expect(db.open).toBe(false);
    });
    
    it('should clear cache on shutdown', async () => {
      app = await startServer({
        port: 0,
        dbPath: testDbPath,
        cacheEnabled: true,
        env: 'test'
      });
      
      const cache = app.locals.cache;
      
      // Add something to cache
      cache.set('test-key', 'test-value');
      expect(cache.get('test-key')).toBe('test-value');
      
      await gracefulShutdown();
      
      // Cache should be cleared
      expect(cache.get('test-key')).toBeUndefined();
    });
  });
});
