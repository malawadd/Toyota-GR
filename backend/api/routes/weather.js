import express from 'express';
import { 
  getWeatherData, 
  getWeatherSummary,
  getRainPeriods,
  getWeatherAtTime
} from '../services/weather-service.js';
import { createError } from '../middleware/error-handler.js';
import { query } from 'express-validator';
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
 * Validate ISO timestamp format
 */
function isValidISOTimestamp(value) {
  if (!value) return true; // Optional
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString() === value;
}

/**
 * GET /api/weather
 * Get weather data with optional time range filtering and pagination
 * Query params:
 *   - startTime: Start timestamp (ISO format) (optional)
 *   - endTime: End timestamp (ISO format) (optional)
 *   - page: Page number (default: 1)
 *   - limit: Results per page (default: 100, max: 1000)
 */
router.get('/', 
  [
    query('startTime')
      .optional()
      .custom(isValidISOTimestamp)
      .withMessage('startTime must be a valid ISO timestamp'),
    query('endTime')
      .optional()
      .custom(isValidISOTimestamp)
      .withMessage('endTime must be a valid ISO timestamp'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000').toInt(),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db } = req.app.locals;
      const startTime = req.query.startTime || null;
      const endTime = req.query.endTime || null;
      const page = req.query.page || 1;
      const limit = req.query.limit || 100;
      const offset = (page - 1) * limit;

      // Validate time range
      if (startTime && endTime && new Date(startTime) > new Date(endTime)) {
        return next(createError(
          'INVALID_TIME_RANGE',
          'startTime cannot be after endTime',
          { startTime, endTime },
          400
        ));
      }

      const startQueryTime = Date.now();

      const result = getWeatherData(db, {
        startTime,
        endTime,
        limit,
        offset
      });

      const responseTime = Date.now() - startQueryTime;

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
      next(createError('DATABASE_ERROR', 'Failed to retrieve weather data', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/weather/range
 * Get weather data for a specific time range (alias for /api/weather with time filters)
 * Query params:
 *   - startTime: Start timestamp (ISO format) (required)
 *   - endTime: End timestamp (ISO format) (required)
 *   - page: Page number (default: 1)
 *   - limit: Results per page (default: 100, max: 1000)
 */
router.get('/range', 
  [
    query('startTime')
      .notEmpty()
      .withMessage('startTime is required')
      .custom(isValidISOTimestamp)
      .withMessage('startTime must be a valid ISO timestamp'),
    query('endTime')
      .notEmpty()
      .withMessage('endTime is required')
      .custom(isValidISOTimestamp)
      .withMessage('endTime must be a valid ISO timestamp'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000').toInt(),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db } = req.app.locals;
      const startTime = req.query.startTime;
      const endTime = req.query.endTime;
      const page = req.query.page || 1;
      const limit = req.query.limit || 100;
      const offset = (page - 1) * limit;

      // Validate time range
      if (new Date(startTime) > new Date(endTime)) {
        return next(createError(
          'INVALID_TIME_RANGE',
          'startTime cannot be after endTime',
          { startTime, endTime },
          400
        ));
      }

      const startQueryTime = Date.now();

      const result = getWeatherData(db, {
        startTime,
        endTime,
        limit,
        offset
      });

      const responseTime = Date.now() - startQueryTime;

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
          timeRange: {
            start: startTime,
            end: endTime
          },
          responseTime
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve weather data for time range', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/weather/summary
 * Get aggregated weather statistics with optional time range filtering
 * Query params:
 *   - startTime: Start timestamp (ISO format) (optional)
 *   - endTime: End timestamp (ISO format) (optional)
 */
router.get('/summary',
  [
    query('startTime')
      .optional()
      .custom(isValidISOTimestamp)
      .withMessage('startTime must be a valid ISO timestamp'),
    query('endTime')
      .optional()
      .custom(isValidISOTimestamp)
      .withMessage('endTime must be a valid ISO timestamp'),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db, cache } = req.app.locals;
      const startTime = req.query.startTime || null;
      const endTime = req.query.endTime || null;

      // Validate time range
      if (startTime && endTime && new Date(startTime) > new Date(endTime)) {
        return next(createError(
          'INVALID_TIME_RANGE',
          'startTime cannot be after endTime',
          { startTime, endTime },
          400
        ));
      }

      // Generate cache key based on time range
      const cacheKey = `weather:summary:${startTime || 'all'}:${endTime || 'all'}`;

      // Check cache first
      let summary = cache.get(cacheKey);

      if (!summary) {
        const startQueryTime = Date.now();

        // Query database
        summary = getWeatherSummary(db, {
          startTime,
          endTime
        });

        if (!summary) {
          return next(createError(
            'NO_WEATHER_DATA',
            'No weather data found for the specified time range',
            { startTime, endTime },
            404
          ));
        }

        // Cache the result
        cache.set(cacheKey, summary, 600); // 10 minutes TTL

        summary.responseTime = Date.now() - startQueryTime;
      }

      res.json({
        success: true,
        data: summary,
        meta: {
          timeRange: startTime || endTime ? {
            start: startTime,
            end: endTime
          } : null
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve weather summary', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/weather/rain
 * Get rain periods (time ranges when rain occurred)
 * Query params:
 *   - minRain: Minimum rain value to consider (default: 0)
 */
router.get('/rain',
  [
    query('minRain').optional().isFloat({ min: 0 }).withMessage('minRain must be a non-negative number').toFloat(),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db } = req.app.locals;
      const minRain = req.query.minRain || 0;

      const startTime = Date.now();

      const periods = getRainPeriods(db, { minRain });

      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: periods,
        meta: {
          total: periods.length,
          minRain,
          responseTime
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve rain periods', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/weather/at-time
 * Get weather at a specific time (nearest measurement)
 * Query params:
 *   - time: Target timestamp (ISO format) (required)
 */
router.get('/at-time',
  [
    query('time')
      .notEmpty()
      .withMessage('time parameter is required')
      .custom(isValidISOTimestamp)
      .withMessage('time must be a valid ISO timestamp'),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db } = req.app.locals;
      const targetTime = req.query.time;

      const startQueryTime = Date.now();

      const weather = getWeatherAtTime(db, targetTime);

      const responseTime = Date.now() - startQueryTime;

      if (!weather) {
        return next(createError(
          'NO_WEATHER_DATA',
          'No weather data found',
          { targetTime },
          404
        ));
      }

      res.json({
        success: true,
        data: weather,
        meta: {
          targetTime,
          responseTime
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve weather at time', { originalError: error.message }));
    }
  }
);

export default router;
