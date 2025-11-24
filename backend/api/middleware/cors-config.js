import cors from 'cors';

/**
 * CORS configuration for the Racing Data API
 * Handles cross-origin requests from frontend applications
 */
export function corsConfig() {
  // Parse allowed origins from environment variable or use default
  const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['*'];

  const corsOptions = {
    // Allow requests from specified origins
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        return callback(null, true);
      }

      // Allow all origins if '*' is specified
      if (allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },

    // Allow credentials (cookies, authorization headers)
    credentials: true,

    // Allowed HTTP methods
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

    // Allowed headers
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],

    // Exposed headers (accessible to frontend)
    exposedHeaders: [
      'Content-Length',
      'Content-Type',
      'Cache-Control',
      'ETag'
    ],

    // Preflight cache duration (in seconds)
    maxAge: 86400, // 24 hours

    // Handle preflight OPTIONS requests
    preflightContinue: false,
    optionsSuccessStatus: 204
  };

  return cors(corsOptions);
}

/**
 * Manual CORS headers middleware (alternative to cors package)
 * Useful for custom CORS handling or debugging
 */
export function manualCorsHeaders(req, res, next) {
  const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['*'];

  const origin = req.get('origin');

  // Set Access-Control-Allow-Origin
  if (allowedOrigins.includes('*')) {
    res.header('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }

  // Set other CORS headers
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
}
