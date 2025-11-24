import express from 'express';
import { 
  getSectionsByVehicle, 
  getFastestSectionTimes,
  compareSections,
  getSectionLeaders
} from '../services/section-service.js';
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
 * GET /api/sections
 * Get fastest section times with optional filtering
 * Query params:
 *   - section: Section to query ('s1', 's2', 's3') (default: 's1')
 *   - vehicleId: Filter by vehicle ID (optional)
 *   - class: Filter by vehicle class (optional)
 *   - limit: Maximum records to return (default: 10, max: 100)
 */
router.get('/', 
  [
    query('section').optional().isIn(['s1', 's2', 's3']),
    query('vehicleId')
      .optional()
      .matches(/^GR86-\d{3}-\d{1,3}$/)
      .withMessage('Vehicle ID must match format GR86-XXX-YY'),
    query('class').optional().isString().trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db } = req.app.locals;
      const options = {
        section: req.query.section || 's1',
        vehicleId: req.query.vehicleId || null,
        class: req.query.class || null,
        limit: req.query.limit || 10
      };

      const startTime = Date.now();

      const sections = getFastestSectionTimes(db, options);

      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: sections,
        meta: {
          section: options.section,
          total: sections.length,
          responseTime
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve fastest section times', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/sections/vehicle/:vehicleId
 * Get section times for a specific vehicle
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

      const result = getSectionsByVehicle(db, vehicleId, {
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
      next(createError('DATABASE_ERROR', 'Failed to retrieve section times for vehicle', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/sections/vehicle/:vehicleId/lap/:lap
 * Get section times for a specific vehicle and lap
 * Params:
 *   - vehicleId: Vehicle ID (e.g., 'GR86-004-78')
 *   - lap: Lap number
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
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db } = req.app.locals;
      const vehicleId = req.params.vehicleId;
      const lap = req.params.lap;

      const startTime = Date.now();

      const result = getSectionsByVehicle(db, vehicleId, {
        lap,
        limit: 1,
        offset: 0
      });

      const responseTime = Date.now() - startTime;

      if (result.data.length === 0) {
        return next(createError(
          'SECTION_NOT_FOUND',
          `Section times for vehicle ${vehicleId} lap ${lap} not found`,
          { vehicleId, lap },
          404
        ));
      }

      res.json({
        success: true,
        data: result.data[0],
        meta: {
          responseTime
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve section times for vehicle and lap', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/sections/leaders
 * Get section leaders (fastest vehicle for each section)
 * Query params:
 *   - class: Filter by vehicle class (optional)
 *   - lap: Filter by specific lap number (optional)
 */
router.get('/leaders',
  [
    query('class').optional().isString().trim(),
    query('lap').optional().isInt({ min: 1 }).withMessage('Lap must be a positive integer').toInt(),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db } = req.app.locals;
      const options = {
        class: req.query.class || null,
        lap: req.query.lap || null
      };

      const startTime = Date.now();

      const leaders = getSectionLeaders(db, options);

      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: leaders,
        meta: {
          responseTime
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve section leaders', { originalError: error.message }));
    }
  }
);

export default router;
