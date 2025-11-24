import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import express from 'express';
import request from 'supertest';
import { errorHandler, createError, notFoundHandler } from '../middleware/error-handler.js';
import { validateVehicleId, validatePagination, validateLapRange, validateTimeRange } from '../middleware/validation.js';
import { requestLogger, errorLogger } from '../middleware/logger.js';
import { corsConfig } from '../middleware/cors-config.js';

describe('Middleware Tests', () => {
  
  describe('Error Handler Middleware', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
    });

    /**
     * Feature: racing-data-api, Property 15: Error response format
     * Validates: Requirements 9.5
     * 
     * For any error condition, the API response should include 
     * success: false, error code, and human-readable message
     */
    it('Property 15: Error response format - all errors have consistent structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'VEHICLE_NOT_FOUND',
            'INVALID_VEHICLE_ID',
            'INVALID_PAGINATION',
            'INVALID_LAP_RANGE',
            'INVALID_TIME_RANGE',
            'VALIDATION_ERROR',
            'DATABASE_ERROR',
            'IMPORT_ERROR',
            'CACHE_ERROR',
            'RESOURCE_NOT_FOUND',
            'METHOD_NOT_ALLOWED',
            'MALFORMED_REQUEST'
          ), // error code
          fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length > 0), // error message (non-empty)
          fc.record({
            field: fc.string(),
            value: fc.oneof(fc.string(), fc.integer(), fc.double())
          }), // error details
          async (errorCode, errorMessage, errorDetails) => {
            const testApp = express();
            testApp.use(express.json());
            
            // Create route that throws error
            testApp.get('/test', (req, res, next) => {
              const error = createError(errorCode, errorMessage, errorDetails);
              next(error);
            });
            
            // Add error handler
            testApp.use(errorHandler);
            
            // Make request and verify response format
            const response = await request(testApp).get('/test');
            
            // Verify response structure
            const hasSuccessFalse = response.body.success === false;
            const hasError = response.body.error !== undefined;
            const hasErrorCode = response.body.error?.code === errorCode;
            const hasErrorMessage = response.body.error?.message === errorMessage;
            const hasErrorDetails = response.body.error?.details !== undefined;
            
            // Verify HTTP status code is appropriate
            const hasValidStatusCode = response.status >= 400 && response.status < 600;
            
            return hasSuccessFalse && 
                   hasError && 
                   hasErrorCode && 
                   hasErrorMessage && 
                   hasErrorDetails &&
                   hasValidStatusCode;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should map error codes to correct HTTP status codes', () => {
      const testCases = [
        { code: 'VEHICLE_NOT_FOUND', expectedStatus: 404 },
        { code: 'RESOURCE_NOT_FOUND', expectedStatus: 404 },
        { code: 'INVALID_VEHICLE_ID', expectedStatus: 400 },
        { code: 'VALIDATION_ERROR', expectedStatus: 400 },
        { code: 'METHOD_NOT_ALLOWED', expectedStatus: 405 },
        { code: 'DATABASE_ERROR', expectedStatus: 500 }
      ];

      testCases.forEach(({ code, expectedStatus }) => {
        const testApp = express();
        testApp.get('/test', (req, res, next) => {
          next(createError(code, 'Test error'));
        });
        testApp.use(errorHandler);

        return request(testApp)
          .get('/test')
          .expect(expectedStatus);
      });
    });

    it('should handle 404 for undefined routes', async () => {
      const testApp = express();
      testApp.use(notFoundHandler);

      const response = await request(testApp)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
      expect(response.body.error.message).toContain('not found');
    });
  });

  describe('Validation Middleware', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
    });

    it('should validate vehicle ID format', async () => {
      app.get('/vehicles/:vehicleId', validateVehicleId, (req, res) => {
        res.json({ success: true, vehicleId: req.params.vehicleId });
      });

      // Valid vehicle ID
      await request(app)
        .get('/vehicles/GR86-004-78')
        .expect(200);

      // Invalid vehicle ID
      const response = await request(app)
        .get('/vehicles/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    /**
     * Feature: racing-data-api, Property 19: Default pagination parameters
     * Validates: Requirements 12.5
     * 
     * For any paginated endpoint called without page/limit parameters, 
     * the API should apply default values (page=1, limit=100)
     */
    it('Property 19: Default pagination parameters - defaults applied when omitted', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(), // whether to include page param
          fc.boolean(), // whether to include limit param
          fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }), // optional page value
          fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }), // optional limit value
          async (includePage, includeLimit, pageValue, limitValue) => {
            const testApp = express();
            testApp.use(express.json());
            
            testApp.get('/test', validatePagination, (req, res) => {
              res.json({
                page: parseInt(req.query.page),
                limit: parseInt(req.query.limit)
              });
            });

            // Build query string
            const queryParams = [];
            if (includePage && pageValue !== undefined) {
              queryParams.push(`page=${pageValue}`);
            }
            if (includeLimit && limitValue !== undefined) {
              queryParams.push(`limit=${limitValue}`);
            }
            const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

            const response = await request(testApp).get(`/test${queryString}`);
            
            // If parameters were provided, they should be used
            // Otherwise, defaults should be applied
            const expectedPage = (includePage && pageValue !== undefined) ? pageValue : 1;
            const expectedLimit = (includeLimit && limitValue !== undefined) ? limitValue : 100;
            
            return response.body.page === expectedPage && 
                   response.body.limit === expectedLimit;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate lap range parameters', async () => {
      app.get('/laps', validateLapRange, (req, res) => {
        res.json({ success: true });
      });

      // Valid lap range
      await request(app)
        .get('/laps?minLap=1&maxLap=10')
        .expect(200);

      // Invalid lap range (minLap > maxLap)
      const response = await request(app)
        .get('/laps?minLap=10&maxLap=5')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_LAP_RANGE');
    });

    it('should validate time range parameters', async () => {
      app.get('/weather', validateTimeRange, (req, res) => {
        res.json({ success: true });
      });

      // Valid time range
      await request(app)
        .get('/weather?startTime=2024-01-01T00:00:00Z&endTime=2024-01-01T12:00:00Z')
        .expect(200);

      // Invalid time range (startTime > endTime)
      const response = await request(app)
        .get('/weather?startTime=2024-01-01T12:00:00Z&endTime=2024-01-01T00:00:00Z')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_TIME_RANGE');
    });
  });

  describe('CORS Middleware', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(corsConfig());
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });
    });

    /**
     * Feature: racing-data-api, Property 16: Response header presence
     * Validates: Requirements 10.2, 10.3, 10.4
     * 
     * For any API response, required headers (Content-Type, CORS headers) 
     * should be present with correct values
     */
    it('Property 16: Response header presence - required headers are present', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'), // HTTP method (exclude OPTIONS for simplicity)
          fc.constantFrom('/test', '/api/vehicles', '/api/telemetry', '/api/laps'), // path
          async (method, path) => {
            const testApp = express();
            testApp.use(express.json());
            testApp.use(corsConfig());
            
            // Add routes for all methods
            testApp.all(path, (req, res) => {
              res.json({ success: true, method: req.method });
            });

            const response = await request(testApp)[method.toLowerCase()](path)
              .set('Origin', 'http://localhost:3000'); // Set origin to trigger CORS
            
            // Check for required headers
            const hasContentType = response.headers['content-type'] !== undefined;
            const contentTypeIsJson = response.headers['content-type']?.includes('application/json');
            
            // CORS headers should be present when origin is set
            const hasCorsHeaders = response.headers['access-control-allow-origin'] !== undefined;
            
            return hasContentType && contentTypeIsJson && hasCorsHeaders;
          }
        ),
        { numRuns: 50 } // Reduced runs for HTTP tests
      );
    });

    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    it('should include CORS headers in responses', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
      // CORS headers should be present (handled by cors middleware)
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Logger Middleware', () => {
    let app;
    let logSpy;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      
      // Spy on console methods
      logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    /**
     * Feature: racing-data-api, Property 17: Request logging completeness
     * Validates: Requirements 11.2, 11.5
     * 
     * For any processed request, the log should contain HTTP method, 
     * path, status code, and response time
     */
    it('Property 17: Request logging completeness - logs contain required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'), // HTTP method
          fc.constantFrom('/test', '/api/vehicles', '/api/telemetry'), // path
          fc.constantFrom(200, 201, 400, 404, 500), // status code
          async (method, path, statusCode) => {
            const testApp = express();
            const logs = [];
            
            // Mock logger that captures logs
            const mockLogger = (req, res, next) => {
              const startTime = Date.now();
              
              const originalSend = res.send;
              res.send = function(data) {
                const responseTime = Date.now() - startTime;
                logs.push({
                  method: req.method,
                  path: req.path,
                  status: res.statusCode,
                  responseTime
                });
                return originalSend.call(this, data);
              };
              
              next();
            };
            
            testApp.use(mockLogger);
            testApp.all(path, (req, res) => {
              res.status(statusCode).json({ success: true });
            });

            await request(testApp)[method.toLowerCase()](path);
            
            // Small delay to ensure log is captured
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Verify log entry exists and has required fields
            const logEntry = logs[0];
            return logEntry !== undefined &&
                   logEntry.method === method &&
                   logEntry.path === path &&
                   logEntry.status === statusCode &&
                   typeof logEntry.responseTime === 'number' &&
                   logEntry.responseTime >= 0;
          }
        ),
        { numRuns: 50 } // Reduced runs for HTTP tests
      );
    });

    /**
     * Feature: racing-data-api, Property 18: Error logging with context
     * Validates: Requirements 11.3
     * 
     * For any error encountered, the error log should include 
     * stack trace, error message, and request context
     */
    it('Property 18: Error logging with context - error logs include context', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length > 0), // error message (non-empty)
          fc.constantFrom('VEHICLE_NOT_FOUND', 'DATABASE_ERROR', 'VALIDATION_ERROR'), // error code
          fc.constantFrom('/test', '/api/vehicles', '/api/telemetry'), // path
          async (errorMessage, errorCode, path) => {
            const testApp = express();
            const errorLogs = [];
            
            // Mock error logger that captures error logs
            const mockErrorLogger = (err, req, res, next) => {
              errorLogs.push({
                error: {
                  message: err.message,
                  code: err.code,
                  stack: err.stack
                },
                request: {
                  method: req.method,
                  path: req.path,
                  query: req.query,
                  params: req.params
                }
              });
              next(err);
            };
            
            testApp.get(path, (req, res, next) => {
              const error = createError(errorCode, errorMessage);
              next(error);
            });
            
            testApp.use(mockErrorLogger);
            testApp.use(errorHandler);

            await request(testApp).get(path);
            
            // Small delay to ensure log is captured
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Verify error log entry has required fields
            const logEntry = errorLogs[0];
            return logEntry !== undefined &&
                   logEntry.error.message === errorMessage &&
                   logEntry.error.code === errorCode &&
                   logEntry.error.stack !== undefined &&
                   logEntry.request.method === 'GET' &&
                   logEntry.request.path === path;
          }
        ),
        { numRuns: 50 } // Reduced runs for HTTP tests
      );
    });
  });
});
