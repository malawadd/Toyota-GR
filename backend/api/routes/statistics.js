import express from 'express';
import { 
  getOverviewStatistics, 
  getVehicleStatistics, 
  getLeaderboard 
} from '../services/statistics-service.js';
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
 * GET /api/statistics/overview
 * Get race-wide statistics
 * Returns aggregated statistics for the entire race
 */
router.get('/overview', (req, res, next) => {
  try {
    const { db, cache } = req.app.locals;
    const cacheKey = CACHE_KEYS.STATS_OVERVIEW;

    // Check cache first
    let stats = cache.get(cacheKey);

    if (!stats) {
      // Query database
      const startTime = Date.now();
      stats = getOverviewStatistics(db);
      const responseTime = Date.now() - startTime;

      // Cache the result (long TTL since race data is static)
      cache.set(cacheKey, stats, 3600); // 1 hour TTL

      res.json({
        success: true,
        data: stats,
        meta: {
          responseTime
        }
      });
    } else {
      res.json({
        success: true,
        data: stats,
        meta: {
          cached: true
        }
      });
    }
  } catch (error) {
    next(createError('DATABASE_ERROR', 'Failed to retrieve overview statistics', { originalError: error.message }));
  }
});

/**
 * GET /api/statistics/vehicle/:vehicleId
 * Get pre-computed statistics for a specific vehicle
 * Params:
 *   - vehicleId: Vehicle ID (e.g., 'GR86-004-78')
 */
router.get('/vehicle/:vehicleId',
  [
    param('vehicleId')
      .notEmpty()
      .withMessage('Vehicle ID is required')
      .matches(/^GR86-\d{3}-\d{1,3}$/)
      .withMessage('Vehicle ID must match format GR86-XXX-YY'),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db, cache } = req.app.locals;
      const vehicleId = req.params.vehicleId;
      const cacheKey = `stats:vehicle:${vehicleId}`;

      // Check cache first
      let stats = cache.get(cacheKey);

      if (!stats) {
        // Query database
        const startTime = Date.now();
        stats = getVehicleStatistics(db, vehicleId);
        
        if (!stats) {
          return next(createError(
            'VEHICLE_NOT_FOUND',
            `Vehicle with ID ${vehicleId} not found`,
            { vehicleId },
            404
          ));
        }

        const responseTime = Date.now() - startTime;

        // Cache the result
        cache.set(cacheKey, stats, 1800); // 30 minutes TTL

        res.json({
          success: true,
          data: stats,
          meta: {
            responseTime
          }
        });
      } else {
        res.json({
          success: true,
          data: stats,
          meta: {
            cached: true
          }
        });
      }
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve vehicle statistics', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/statistics/leaderboard
 * Get ranked vehicles by performance metric
 * Query params:
 *   - sortBy: Sort field (fastest_lap, average_lap, max_speed, position, total_laps)
 *   - order: Sort order (asc, desc)
 *   - class: Optional filter by vehicle class
 *   - limit: Maximum records to return (default: 50, max: 100)
 */
router.get('/leaderboard',
  [
    query('sortBy').optional().isIn(['fastest_lap', 'average_lap', 'max_speed', 'position', 'total_laps']),
    query('order').optional().isIn(['asc', 'desc']),
    query('class').optional().isString().trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db, cache } = req.app.locals;
      const options = {
        sortBy: req.query.sortBy || 'fastest_lap',
        order: req.query.order || 'asc',
        class: req.query.class || null,
        limit: req.query.limit || 50
      };

      // Generate cache key based on options
      const cacheKey = `${CACHE_KEYS.LEADERBOARD}:${options.sortBy}:${options.order}:${options.class || 'all'}:${options.limit}`;

      // Check cache first
      let leaderboard = cache.get(cacheKey);

      if (!leaderboard) {
        // Query database
        const startTime = Date.now();
        leaderboard = getLeaderboard(db, options);
        const responseTime = Date.now() - startTime;

        // Cache the result
        cache.set(cacheKey, leaderboard, 1800); // 30 minutes TTL

        res.json({
          success: true,
          data: leaderboard,
          meta: {
            total: leaderboard.length,
            sortBy: options.sortBy,
            order: options.order,
            class: options.class,
            responseTime
          }
        });
      } else {
        res.json({
          success: true,
          data: leaderboard,
          meta: {
            total: leaderboard.length,
            sortBy: options.sortBy,
            order: options.order,
            class: options.class,
            cached: true
          }
        });
      }
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve leaderboard', { originalError: error.message }));
    }
  }
);

export default router;
