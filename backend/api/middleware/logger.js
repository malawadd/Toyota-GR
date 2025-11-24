import winston from 'winston';

/**
 * Configure Winston logger
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
          }
          return msg;
        })
      )
    }),
    // File transport for errors
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: winston.format.json()
    }),
    // File transport for all logs
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: winston.format.json()
    })
  ]
});

/**
 * Request logging middleware
 * Logs HTTP method, path, status code, and response time for each request
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    
    const responseTime = Date.now() - startTime;
    
    // Log response
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      responseTime: `${responseTime}ms`
    });
    
    return res.send(data);
  };

  next();
}

/**
 * Error logging middleware
 * Logs errors with stack trace and request context
 */
export function errorLogger(err, req, res, next) {
  // Log error with full context
  logger.error('Request error', {
    error: {
      message: err.message,
      code: err.code,
      stack: err.stack
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      params: req.params,
      body: req.body,
      ip: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // Pass error to next error handler
  next(err);
}

/**
 * Startup logging
 * Logs server startup information
 */
export function logStartup(config) {
  logger.info('Racing Data API starting', {
    port: config.port,
    dbPath: config.dbPath,
    cacheEnabled: config.cacheEnabled,
    cacheTTL: config.cacheTTL,
    logLevel: config.logLevel,
    nodeEnv: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
}

/**
 * Export logger instance for use in other modules
 */
export { logger };
