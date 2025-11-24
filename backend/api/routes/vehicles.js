import express from 'express';
import { 
  getAllVehicles, 
  getVehicleById, 
  getVehicleByCarNumber,
  getVehicleStatistics 
} from '../services/vehicle-service.js';
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
 * GET /api/vehicles
 * Get all vehicles with optional filtering and sorting
 * Query params:
 *   - class: Filter by vehicle class (e.g., 'Pro', 'Am')
 *   - sortBy: Sort field (fastest_lap, average_lap, position, car_number, max_speed)
 *   - order: Sort order (asc, desc)
 */
router.get('/', 
  [
    query('class').optional().isString().trim(),
    query('sortBy').optional().isIn(['fastest_lap', 'average_lap', 'position', 'car_number', 'max_speed']),
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
        ? `${CACHE_KEYS.VEHICLES_ALL}:class:${filters.class}:sort:${filters.sortBy || 'position'}:${filters.order || 'asc'}`
        : `${CACHE_KEYS.VEHICLES_ALL}:sort:${filters.sortBy || 'position'}:${filters.order || 'asc'}`;

      // Check cache first
      let vehicles = cache.get(cacheKey);

      if (!vehicles) {
        // Query database
        vehicles = getAllVehicles(db, filters);
        
        // Cache the result
        cache.set(cacheKey, vehicles, 1800); // 30 minutes TTL
      }

      // Format response with statistics
      const formattedVehicles = vehicles.map(v => ({
        vehicleId: v.vehicle_id,
        carNumber: v.car_number,
        class: v.class,
        statistics: {
          fastestLap: v.fastest_lap,
          averageLap: v.average_lap,
          totalLaps: v.total_laps,
          maxSpeed: v.max_speed,
          position: v.position
        }
      }));

      res.json({
        success: true,
        data: formattedVehicles,
        meta: {
          total: formattedVehicles.length
        }
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve vehicles', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/vehicles/:id
 * Get vehicle by ID with detailed statistics
 * Params:
 *   - id: Vehicle ID (e.g., 'GR86-004-78')
 */
router.get('/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('Vehicle ID is required')
      .matches(/^GR86-\d{3}-\d{1,3}$/)
      .withMessage('Vehicle ID must match format GR86-XXX-YY'),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db, cache } = req.app.locals;
      const vehicleId = req.params.id;
      const cacheKey = `${CACHE_KEYS.VEHICLE_PREFIX}${vehicleId}`;

      // Check cache first
      let vehicleData = cache.get(cacheKey);

      if (!vehicleData) {
        // Query database
        vehicleData = getVehicleStatistics(db, vehicleId);
        
        if (!vehicleData) {
          return next(createError(
            'VEHICLE_NOT_FOUND', 
            `Vehicle with ID ${vehicleId} not found`,
            { vehicleId },
            404
          ));
        }

        // Cache the result
        cache.set(cacheKey, vehicleData, 1800); // 30 minutes TTL
      }

      res.json({
        success: true,
        data: vehicleData
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve vehicle', { originalError: error.message }));
    }
  }
);

/**
 * GET /api/vehicles/by-number/:carNumber
 * Get vehicle by car number
 * Params:
 *   - carNumber: Car number (e.g., 78)
 */
router.get('/by-number/:carNumber',
  [
    param('carNumber')
      .notEmpty()
      .withMessage('Car number is required')
      .isInt({ min: 1 })
      .withMessage('Car number must be a positive integer')
      .toInt(),
    handleValidationErrors
  ],
  (req, res, next) => {
    try {
      const { db, cache } = req.app.locals;
      const carNumber = req.params.carNumber;
      const cacheKey = `vehicle:by-number:${carNumber}`;

      // Check cache first
      let vehicle = cache.get(cacheKey);

      if (!vehicle) {
        // Query database
        vehicle = getVehicleByCarNumber(db, carNumber);
        
        if (!vehicle) {
          return next(createError(
            'VEHICLE_NOT_FOUND',
            `Vehicle with car number ${carNumber} not found`,
            { carNumber },
            404
          ));
        }

        // Cache the result
        cache.set(cacheKey, vehicle, 1800); // 30 minutes TTL
      }

      // Format response with statistics
      const formattedVehicle = {
        vehicleId: vehicle.vehicle_id,
        carNumber: vehicle.car_number,
        class: vehicle.class,
        statistics: {
          fastestLap: vehicle.fastest_lap,
          averageLap: vehicle.average_lap,
          totalLaps: vehicle.total_laps,
          maxSpeed: vehicle.max_speed,
          position: vehicle.position
        }
      };

      res.json({
        success: true,
        data: formattedVehicle
      });
    } catch (error) {
      next(createError('DATABASE_ERROR', 'Failed to retrieve vehicle by car number', { originalError: error.message }));
    }
  }
);

export default router;
