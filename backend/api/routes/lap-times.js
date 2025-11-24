import express from 'express';
import { 
  getLapsByVehicle, 
  getFastestLaps,
  compareLaps,
  getLapStatistics
} from '../services/lap-service.js';
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
 * GET /api/lap-times
 * Get lap times with optional filtering
 * Query params:
 *   - vehicleId: Filter by vehicle ID (optional)
 *   - minLap: Minimum lap number (optional)
 *   - maxLap: Maximum lap number (optional)
 *   - page: Page number (default: 1)
 *   - limit: Results per page (default: 100, max: 1000)
 */
router.get('/', 
  [
    query('vehicleId')
      .optional()
      .matches(/^GR86-\d{3}-\d{1,3}$/)
      .withMessage('Vehicle ID must match format GR86-XXX-YY'),
    query('minLap').optional().isInt({ min: 1 }).withMessage('minLap must be a positive integer').toInt(),
    query('maxLap').optional().isInt({ min: 1 }).withMessage('maxLap must be a positive integer').toInt(),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000').toInt(),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db } = req.app.locals;
      const vehicleId = req.query.vehicleId;
      const minLap = req.query.minLap || null;
      const maxLap = req.query.maxLap || null;
      const page = req.query.page || 1;
      const limit = req.query.limit || 100;
      const offset = (page - 1) * limit;

      // Validate lap range
      if (minLap && maxLap && minLap > maxLap) {
        return next(createError(
          'INVALID_LAP_RANGE',
          'minLap cannot be greater than maxLap',
          { minLap, maxLap },
          400
        ));
      }

      let result;

      if (vehicleId) {
        // Get laps for specific vehicle
        result = getLapsByVehicle(db, vehicleId, {
          minLap,
          maxLap,
          limit,
          offset
        });
      } else {
        // Get all laps with filters
        let sql = 'SELECT * FROM lap_times WHERE 1=1';
        const params = [];

        if (minLap !== null) {
          sql += ' AND lap >= ?';
          params.push(minLap);
        }

        if (maxLap !== null) {
          sql += ' AND lap <= ?';
          params.push(maxLap);
        }

        sql += ' ORDER BY lap_time ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const stmt = db.prepare(sql);
        const data = stmt.all(...params);

        // Get total count
        let countSql = 'SELECT COUNT(*) as total FROM lap_times WHERE 1=1';
        const countParams = [];

        if (minLap !== null) {
          countSql += ' AND lap >= ?';
          countParams.push(minLap);
        }

        if (maxLap !== null) {
          countSql += ' AND lap <= ?';
          countParams.push(maxLap);
        }

        const countStmt = db.prepare(countSql);
        const { total } = countStmt.get(...countParams);

        result = { data, total };
      }

      const startTime = Date.now();
      const responseTime = Date.now() - startTime;

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
      next(createError('DATABASE_ERROR', 'Failed to retrieve lap times', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/lap-times/vehicle/:vehicleId
 * Get lap times for a specific vehicle
 * Params:
 *   - vehicleId: Vehicle ID (e.g., 'GR86-004-78')
 * Query params:
 *   - minLap: Minimum lap number (optional)
 *   - maxLap: Maximum lap number (optional)
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
    query('minLap').optional().isInt({ min: 1 }).withMessage('minLap must be a positive integer').toInt(),
    query('maxLap').optional().isInt({ min: 1 }).withMessage('maxLap must be a positive integer').toInt(),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000').toInt(),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db } = req.app.locals;
      const vehicleId = req.params.vehicleId;
      const minLap = req.query.minLap || null;
      const maxLap = req.query.maxLap || null;
      const page = req.query.page || 1;
      const limit = req.query.limit || 100;
      const offset = (page - 1) * limit;

      // Validate lap range
      if (minLap && maxLap && minLap > maxLap) {
        return next(createError(
          'INVALID_LAP_RANGE',
          'minLap cannot be greater than maxLap',
          { minLap, maxLap },
          400
        ));
      }

      const startTime = Date.now();

      const result = getLapsByVehicle(db, vehicleId, {
        minLap,
        maxLap,
        limit,
        offset
      });

      const responseTime = Date.now() - startTime;

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
      next(createError('DATABASE_ERROR', 'Failed to retrieve lap times for vehicle', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/lap-times/fastest
 * Get fastest lap times
 * Query params:
 *   - limit: Maximum records to return (default: 10, max: 100)
 *   - vehicleId: Filter by vehicle ID (optional)
 *   - class: Filter by vehicle class (optional)
 */
router.get('/fastest',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
    query('vehicleId')
      .optional()
      .matches(/^GR86-\d{3}-\d{1,3}$/)
      .withMessage('Vehicle ID must match format GR86-XXX-YY'),
    query('class').optional().isString().trim(),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db } = req.app.locals;
      const limit = req.query.limit || 10;
      const vehicleId = req.query.vehicleId || null;
      const vehicleClass = req.query.class || null;

      const startTime = Date.now();

      const laps = getFastestLaps(db, {
        limit,
        vehicleId,
        class: vehicleClass
      });

      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: laps,
        meta: {
          total: laps.length,
          responseTime
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve fastest laps', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/lap-times/compare
 * Compare lap times for multiple vehicles
 * Query params:
 *   - vehicleIds: Comma-separated list of vehicle IDs (required)
 *   - minLap: Minimum lap number (optional)
 *   - maxLap: Maximum lap number (optional)
 */
router.get('/compare',
  [
    query('vehicleIds')
      .notEmpty()
      .withMessage('vehicleIds parameter is required')
      .isString()
      .custom((value) => {
        const ids = value.split(',').map(id => id.trim());
        const validFormat = /^GR86-\d{3}-\d{1,3}$/;
        return ids.every(id => validFormat.test(id));
      })
      .withMessage('All vehicle IDs must match format GR86-XXX-YY'),
    query('minLap').optional().isInt({ min: 1 }).withMessage('minLap must be a positive integer').toInt(),
    query('maxLap').optional().isInt({ min: 1 }).withMessage('maxLap must be a positive integer').toInt(),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db } = req.app.locals;
      const vehicleIds = req.query.vehicleIds.split(',').map(id => id.trim());
      const minLap = req.query.minLap || null;
      const maxLap = req.query.maxLap || null;

      // Validate lap range
      if (minLap && maxLap && minLap > maxLap) {
        return next(createError(
          'INVALID_LAP_RANGE',
          'minLap cannot be greater than maxLap',
          { minLap, maxLap },
          400
        ));
      }

      const startTime = Date.now();

      const comparison = compareLaps(db, vehicleIds, {
        minLap,
        maxLap
      });

      const responseTime = Date.now() - startTime;

      // Calculate total laps across all vehicles
      const totalLaps = Object.values(comparison).reduce((sum, laps) => sum + laps.length, 0);

      res.json({
        success: true,
        data: comparison,
        meta: {
          vehicleCount: vehicleIds.length,
          totalLaps,
          responseTime
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to compare lap times', { originalError: error.message }));
    }
  }
);

export default router;
