import express from 'express';
import { 
  getTelemetryByVehicle, 
  getAggregatedTelemetry,
  getTelemetryStream 
} from '../services/telemetry-service.js';
import { CACHE_KEYS } from '../cache/cache-manager.js';
import { createError } from '../middleware/error-handler.js';
import { param, query } from 'express-validator';
import { validationResult } from 'express-validator';

const router = express.Router();

/**
 * Helper middleware to handle validation errors
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errors.array()
      }
    });
  }
  next();
}

/**
 * GET /api/telemetry
 * Get telemetry data with filtering and pagination
 * Query params:
 *   - vehicleId: Filter by vehicle ID (required)
 *   - lap: Filter by lap number (optional)
 *   - telemetryNames: Comma-separated list of telemetry types (optional)
 *   - page: Page number (default: 1)
 *   - limit: Results per page (default: 100, max: 1000)
 */
router.get('/', 
  [
    query('vehicleId')
      .notEmpty()
      .withMessage('Vehicle ID is required')
      .matches(/^GR86-\d{3}-\d{1,3}$/)
      .withMessage('Vehicle ID must match format GR86-XXX-YY'),
    query('lap').optional().isInt({ min: 1 }).withMessage('Lap must be a positive integer').toInt(),
    query('telemetryNames').optional().isString(),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000').toInt(),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db } = req.app.locals;
      const vehicleId = req.query.vehicleId;
      const lap = req.query.lap || null;
      const page = req.query.page || 1;
      const limit = req.query.limit || 100;
      const offset = (page - 1) * limit;
      
      // Parse telemetry names if provided
      const telemetryNames = req.query.telemetryNames 
        ? req.query.telemetryNames.split(',').map(name => name.trim())
        : null;

      const startTime = Date.now();

      // Query database
      const result = getTelemetryByVehicle(db, vehicleId, {
        lap,
        limit,
        offset,
        telemetryNames
      });

      const responseTime = Date.now() - startTime;

      // Format response
      res.json({
        success: true,
        data: result.data,
        meta: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
          hasNext: page * limit < result.total,
          hasPrev: page > 1,
          responseTime
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve telemetry data', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/telemetry/vehicle/:vehicleId
 * Get telemetry data for a specific vehicle
 * Params:
 *   - vehicleId: Vehicle ID (e.g., 'GR86-004-78')
 * Query params:
 *   - lap: Filter by lap number (optional)
 *   - telemetryNames: Comma-separated list of telemetry types (optional)
 *   - page: Page number (default: 1)
 *   - limit: Results per page (default: 100, max: 1000)
 */
router.get('/vehicle/:vehicleId',
  [
    param('vehicleId')
      .notEmpty()
      .withMessage('Vehicle ID is required')
      .matches(/^GR86-\d{3}-\d{1,3}$/)
      .withMessage('Vehicle ID must match format GR86-XXX-YY'),
    query('lap').optional().isInt({ min: 1 }).withMessage('Lap must be a positive integer').toInt(),
    query('telemetryNames').optional().isString(),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000').toInt(),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db } = req.app.locals;
      const vehicleId = req.params.vehicleId;
      const lap = req.query.lap || null;
      const page = req.query.page || 1;
      const limit = req.query.limit || 100;
      const offset = (page - 1) * limit;
      
      // Parse telemetry names if provided
      const telemetryNames = req.query.telemetryNames 
        ? req.query.telemetryNames.split(',').map(name => name.trim())
        : null;

      const startTime = Date.now();

      // Query database
      const result = getTelemetryByVehicle(db, vehicleId, {
        lap,
        limit,
        offset,
        telemetryNames
      });

      const responseTime = Date.now() - startTime;

      // Format response
      res.json({
        success: true,
        data: result.data,
        meta: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
          hasNext: page * limit < result.total,
          hasPrev: page > 1,
          responseTime
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve telemetry data', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/telemetry/vehicle/:vehicleId/lap/:lap
 * Get telemetry data for a specific vehicle and lap
 * Params:
 *   - vehicleId: Vehicle ID (e.g., 'GR86-004-78')
 *   - lap: Lap number
 * Query params:
 *   - telemetryNames: Comma-separated list of telemetry types (optional)
 *   - page: Page number (default: 1)
 *   - limit: Results per page (default: 100, max: 1000)
 */
router.get('/vehicle/:vehicleId/lap/:lap',
  [
    param('vehicleId')
      .notEmpty()
      .withMessage('Vehicle ID is required')
      .matches(/^GR86-\d{3}-\d{1,3}$/)
      .withMessage('Vehicle ID must match format GR86-XXX-YY'),
    param('lap')
      .notEmpty()
      .withMessage('Lap number is required')
      .isInt({ min: 1 })
      .withMessage('Lap must be a positive integer')
      .toInt(),
    query('telemetryNames').optional().isString(),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000').toInt(),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db } = req.app.locals;
      const vehicleId = req.params.vehicleId;
      const lap = req.params.lap;
      const page = req.query.page || 1;
      const limit = req.query.limit || 100;
      const offset = (page - 1) * limit;
      
      // Parse telemetry names if provided
      const telemetryNames = req.query.telemetryNames 
        ? req.query.telemetryNames.split(',').map(name => name.trim())
        : null;

      const startTime = Date.now();

      // Query database
      const result = getTelemetryByVehicle(db, vehicleId, {
        lap,
        limit,
        offset,
        telemetryNames
      });

      const responseTime = Date.now() - startTime;

      // Format response
      res.json({
        success: true,
        data: result.data,
        meta: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
          hasNext: page * limit < result.total,
          hasPrev: page > 1,
          responseTime
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve telemetry data for lap', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/telemetry/vehicle/:vehicleId/stats
 * Get aggregated telemetry statistics for a vehicle
 * Params:
 *   - vehicleId: Vehicle ID (e.g., 'GR86-004-78')
 * Query params:
 *   - lap: Filter by lap number (optional)
 */
router.get('/vehicle/:vehicleId/stats',
  [
    param('vehicleId')
      .notEmpty()
      .withMessage('Vehicle ID is required')
      .matches(/^GR86-\d{3}-\d{1,3}$/)
      .withMessage('Vehicle ID must match format GR86-XXX-YY'),
    query('lap').optional().isInt({ min: 1 }).withMessage('Lap must be a positive integer').toInt(),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db, cache } = req.app.locals;
      const vehicleId = req.params.vehicleId;
      const lap = req.query.lap || null;
      
      // Generate cache key
      const cacheKey = lap 
        ? `${CACHE_KEYS.TELEMETRY_STATS_PREFIX}${vehicleId}:lap:${lap}`
        : `${CACHE_KEYS.TELEMETRY_STATS_PREFIX}${vehicleId}`;

      // Check cache first
      let stats = cache.get(cacheKey);

      if (!stats) {
        const startTime = Date.now();
        
        // Query database
        stats = getAggregatedTelemetry(db, vehicleId, lap);
        
        if (!stats) {
          return next(createError(
            'TELEMETRY_NOT_FOUND',
            `No telemetry data found for vehicle ${vehicleId}${lap ? ` on lap ${lap}` : ''}`,
            { vehicleId, lap },
            404
          ));
        }

        const responseTime = Date.now() - startTime;
        stats._responseTime = responseTime;

        // Cache the result (10 minutes TTL)
        cache.set(cacheKey, stats, 600);
      }

      const responseTime = stats._responseTime || 0;
      delete stats._responseTime;

      res.json({
        success: true,
        data: stats,
        meta: {
          responseTime
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve telemetry statistics', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/telemetry/stream/:vehicleId
 * Stream telemetry data using Server-Sent Events (SSE)
 * Params:
 *   - vehicleId: Vehicle ID (e.g., 'GR86-004-78')
 * Query params:
 *   - lap: Filter by lap number (optional)
 *   - telemetryNames: Comma-separated list of telemetry types (optional)
 *   - playbackSpeed: Playback speed multiplier (default: 1.0, e.g., 2.0 for 2x speed)
 */
router.get('/stream/:vehicleId',
  [
    param('vehicleId')
      .notEmpty()
      .withMessage('Vehicle ID is required')
      .matches(/^GR86-\d{3}-\d{1,3}$/)
      .withMessage('Vehicle ID must match format GR86-XXX-YY'),
    query('lap').optional().isInt({ min: 1 }).withMessage('Lap must be a positive integer').toInt(),
    query('telemetryNames').optional().isString(),
    query('playbackSpeed').optional().isFloat({ min: 0.1, max: 10 }).withMessage('Playback speed must be between 0.1 and 10').toFloat(),
    handleValidationErrors
  ],
  async (req, res, next) => {
    try {
      const { db } = req.app.locals;
      const vehicleId = req.params.vehicleId;
      const lap = req.query.lap || null;
      const playbackSpeed = req.query.playbackSpeed || 1.0;
      
      // Parse telemetry names if provided
      const telemetryNames = req.query.telemetryNames 
        ? req.query.telemetryNames.split(',').map(name => name.trim())
        : null;

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      // Send initial connection message
      res.write('event: connected\n');
      res.write(`data: ${JSON.stringify({ vehicleId, lap, playbackSpeed })}\n\n`);

      // Track if client disconnected
      let clientConnected = true;

      // Handle client disconnect
      req.on('close', () => {
        clientConnected = false;
      });

      try {
        // Get telemetry stream
        const stream = getTelemetryStream(db, vehicleId, {
          lap,
          telemetryNames,
          batchSize: 100
        });

        let previousTimestamp = null;

        // Stream data in chronological order
        for await (const batch of stream) {
          if (!clientConnected) {
            break;
          }

          for (const record of batch) {
            if (!clientConnected) {
              break;
            }

            // Calculate delay based on timestamp difference and playback speed
            if (previousTimestamp) {
              const currentTime = new Date(record.timestamp).getTime();
              const previousTime = new Date(previousTimestamp).getTime();
              const timeDiff = currentTime - previousTime;
              
              // Apply playback speed (delay = actual time difference / playback speed)
              const delay = timeDiff / playbackSpeed;
              
              // Only delay if there's a meaningful time difference (> 1ms)
              if (delay > 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }

            previousTimestamp = record.timestamp;

            // Send telemetry data point
            res.write('event: telemetry\n');
            res.write(`data: ${JSON.stringify(record)}\n\n`);
          }
        }

        // Send completion message
        if (clientConnected) {
          res.write('event: complete\n');
          res.write('data: {"message": "Stream completed"}\n\n');
          res.end();
        }
      } catch (streamError) {
        if (clientConnected) {
          res.write('event: error\n');
          res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
          res.end();
        }
      }
    } catch (error) {
      next(createError('STREAM_ERROR', 'Failed to establish telemetry stream', { originalError: error.message }));
    }
  }
);

export default router;
