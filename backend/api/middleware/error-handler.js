/**
 * Global error handler middleware
 * Formats all errors with consistent structure and maps to appropriate HTTP status codes
 */
export function errorHandler(err, req, res, next) {
  // Default error response
  const errorResponse = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: err.details || {}
    }
  };

  // Determine HTTP status code based on error type
  let statusCode = 500;

  // Map error codes to HTTP status codes
  switch (err.code) {
    case 'VEHICLE_NOT_FOUND':
    case 'RESOURCE_NOT_FOUND':
      statusCode = 404;
      break;
    
    case 'INVALID_VEHICLE_ID':
    case 'INVALID_PAGINATION':
    case 'INVALID_LAP_RANGE':
    case 'INVALID_TIME_RANGE':
    case 'VALIDATION_ERROR':
    case 'MALFORMED_REQUEST':
      statusCode = 400;
      break;
    
    case 'METHOD_NOT_ALLOWED':
      statusCode = 405;
      break;
    
    case 'DATABASE_ERROR':
    case 'IMPORT_ERROR':
    case 'CACHE_ERROR':
    default:
      statusCode = 500;
      break;
  }

  // Use status code from error if explicitly set
  if (err.statusCode) {
    statusCode = err.statusCode;
  }

  // Log error (will be picked up by logger middleware)
  if (statusCode >= 500) {
    console.error('Server error:', {
      code: errorResponse.error.code,
      message: errorResponse.error.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Helper function to create standardized error objects
 */
export function createError(code, message, details = {}, statusCode = null) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  if (statusCode) {
    error.statusCode = statusCode;
  }
  return error;
}

/**
 * Middleware to handle 404 Not Found for undefined routes
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      details: { method: req.method, path: req.path }
    }
  });
}

/**
 * Middleware to handle unsupported HTTP methods
 */
export function methodNotAllowedHandler(allowedMethods) {
  return (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `Method ${req.method} is not allowed for this endpoint`,
          details: { 
            method: req.method, 
            allowedMethods 
          }
        }
      });
    }
    next();
  };
}
