/**
 * Configuration module for Racing Data API
 * Supports environment variables with sensible defaults
 */

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  
  // Database configuration
  dbPath: process.env.DB_PATH || '../data/racing.db',
  
  // Cache configuration
  cacheEnabled: process.env.CACHE_ENABLED !== 'false',
  cacheTTL: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes default
  cacheMaxKeys: parseInt(process.env.CACHE_MAX_KEYS) || 1000,
  
  // CORS configuration
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
  
  // Logging configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || './logs/api.log',
  
  // Pagination defaults
  defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE) || 100,
  maxPageSize: parseInt(process.env.MAX_PAGE_SIZE) || 1000,
  
  // Performance settings
  telemetryQueryTimeout: parseInt(process.env.TELEMETRY_QUERY_TIMEOUT) || 100, // ms
  statisticsQueryTimeout: parseInt(process.env.STATISTICS_QUERY_TIMEOUT) || 50, // ms
  
  // Streaming configuration
  streamingEnabled: process.env.STREAMING_ENABLED !== 'false',
  defaultPlaybackSpeed: parseFloat(process.env.DEFAULT_PLAYBACK_SPEED) || 1.0,
  
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production'
};

export default config;
