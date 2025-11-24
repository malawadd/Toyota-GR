import express from 'express';
import { 
  getAllResults, 
  getResultByVehicle,
  getResultsByClass
} from '../services/results-service.js';
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
 * GET /api/results
 * Get all race results with optional filtering and sorting
 * Query params:
 *   - class: Filter by vehicle class (e.g., 'Pro', 'Am')
 *   - sortBy: Sort field (position, laps, car_number)
 *   - order: Sort order (asc, desc)
 */
router.get('/', 
  [
    query('class').optional().isString().trim(),
    query('sortBy').optional().isIn(['position', 'laps', 'car_number', 'class']),
    query('order').optional().isIn(['asc', 'desc']),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db, cache } = req.app.locals;
      const filters = {
        class: req.query.class,
        sortBy: req.query.sortBy,
        order: req.query.order
      };

      // Generate cache key based on filters
      const cacheKey = filters.class 
        ? `${CACHE_KEYS.RESULTS_ALL}:class:${filters.class}:sort:${filters.sortBy || 'position'}:${filters.order || 'asc'}`
        : `${CACHE_KEYS.RESULTS_ALL}:sort:${filters.sortBy || 'position'}:${filters.order || 'asc'}`;

      // Check cache first
      let results = cache.get(cacheKey);

      if (!results) {
        // Query database
        results = getAllResults(db, filters);
        
        // Cache the result (race results are static after race)
        cache.set(cacheKey, results, 1800); // 30 minutes TTL
      }

      const startTime = Date.now();
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: results,
        meta: {
          total: results.length,
          responseTime
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve race results', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/results/vehicle/:vehicleId
 * Get race result for a specific vehicle
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
      const cacheKey = `result:vehicle:${vehicleId}`;

      // Check cache first
      let result = cache.get(cacheKey);

      if (!result) {
        // Query database
        result = getResultByVehicle(db, vehicleId);
        
        if (!result) {
          return next(createError(
            'VEHICLE_NOT_FOUND', 
            `Race result for vehicle ${vehicleId} not found`,
            { vehicleId },
            404
          ));
        }

        // Cache the result
        cache.set(cacheKey, result, 1800); // 30 minutes TTL
      }

      const startTime = Date.now();
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: result,
        meta: {
          responseTime
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve race result for vehicle', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/results/class/:class
 * Get race results filtered by vehicle class
 * Params:
 *   - class: Vehicle class (e.g., 'Pro', 'Am')
 * Query params:
 *   - sortBy: Sort field (position, laps, car_number)
 *   - order: Sort order (asc, desc)
 */
router.get('/class/:class',
  [
    param('class')
      .notEmpty()
      .withMessage('Class is required')
      .isString()
      .trim(),
    query('sortBy').optional().isIn(['position', 'laps', 'car_number']),
    query('order').optional().isIn(['asc', 'desc']),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db, cache } = req.app.locals;
      const vehicleClass = req.params.class;
      const options = {
        sortBy: req.query.sortBy,
        order: req.query.order
      };

      const cacheKey = `results:class:${vehicleClass}:sort:${options.sortBy || 'position'}:${options.order || 'asc'}`;

      // Check cache first
      let results = cache.get(cacheKey);

      if (!results) {
        // Query database
        results = getResultsByClass(db, vehicleClass, options);
        
        // Cache the result
        cache.set(cacheKey, results, 1800); // 30 minutes TTL
      }

      const startTime = Date.now();
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: results,
        meta: {
          total: results.length,
          class: vehicleClass,
          responseTime
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve race results by class', { originalError: error.message }));
    }
  }
);

export default router;
