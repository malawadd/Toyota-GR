import { param, query, validationResult } from 'express-validator';

/**
 * Middleware to validate vehicle ID format
 * Vehicle IDs should match pattern: GR86-XXX-YY
 */
export const validateVehicleId = [
  param('vehicleId')
    .notEmpty()
    .withMessage('Vehicle ID is required')
    .matches(/^GR86-\d{3}-\d{1,3}$/)
    .withMessage('Vehicle ID must match format GR86-XXX-YY'),
  handleValidationErrors
];

/**
 * Middleware to validate pagination parameters with defaults
 * Default: page=1, limit=100, max limit=1000
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt()
    .customSanitizer(value => value || 1),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000')
    .toInt()
    .customSanitizer(value => value || 100),
  (req, res, next) => {
    // Apply defaults if not provided
    req.query.page = req.query.page || 1;
    req.query.limit = req.query.limit || 100;
    next();
  },
  handleValidationErrors
];

/**
 * Middleware to validate lap range parameters
 * minLap and maxLap should be positive integers
 */
export const validateLapRange = [
  query('minLap')
    .optional()
    .isInt({ min: 1 })
    .withMessage('minLap must be a positive integer')
    .toInt(),
  query('maxLap')
    .optional()
    .isInt({ min: 1 })
    .withMessage('maxLap must be a positive integer')
    .toInt(),
  query('lap')
    .optional()
    .isInt({ min: 1 })
    .withMessage('lap must be a positive integer')
    .toInt(),
  (req, res, next) => {
    // Validate that minLap <= maxLap if both provided
    if (req.query.minLap && req.query.maxLap && req.query.minLap > req.query.maxLap) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LAP_RANGE',
          message: 'minLap must be less than or equal to maxLap',
          details: { minLap: req.query.minLap, maxLap: req.query.maxLap }
        }
      });
    }
    next();
  },
  handleValidationErrors
];

/**
 * Middleware to validate time range parameters
 * startTime and endTime should be valid ISO 8601 timestamps
 */
export const validateTimeRange = [
  query('startTime')
    .optional()
    .isISO8601()
    .withMessage('startTime must be a valid ISO 8601 timestamp'),
  query('endTime')
    .optional()
    .isISO8601()
    .withMessage('endTime must be a valid ISO 8601 timestamp'),
  query('timestamp')
    .optional()
    .isISO8601()
    .withMessage('timestamp must be a valid ISO 8601 timestamp'),
  (req, res, next) => {
    // Validate that startTime <= endTime if both provided
    if (req.query.startTime && req.query.endTime) {
      const start = new Date(req.query.startTime);
      const end = new Date(req.query.endTime);
      if (start > end) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TIME_RANGE',
            message: 'startTime must be before endTime',
            details: { startTime: req.query.startTime, endTime: req.query.endTime }
          }
        });
      }
    }
    next();
  },
  handleValidationErrors
];

/**
 * Helper middleware to handle validation errors
 * Formats errors in consistent structure
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
