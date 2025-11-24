/**
 * Racing Data API Server
 * Main entry point for the Express.js API server
 */

import express from 'express';
import { config } from './config.js';
import { initializeDatabase } from './database/init.js';
import { CacheManager } from './cache/cache-manager.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { corsConfig } from './middleware/cors-config.js';

// Import routes
import vehiclesRouter from './routes/vehicles.js';
import lapTimesRouter from './routes/lap-times.js';
import telemetryRouter from './routes/telemetry.js';
import resultsRouter from './routes/results.js';
import sectionsRouter from './routes/sections.js';
import weatherRouter from './routes/weather.js';
import statisticsRouter from './routes/statistics.js';
import healthRouter from './routes/health.js';

// Import services for cache pre-warming
import { getAllVehicles } from './services/vehicle-service.js';
import { getAllResults } from './services/results-service.js';
import { getOverviewStatistics } from './services/statistics-service.js';

let server = null;
let db = null;
let cache = null;

/**
 * Start the API server
 * @param {Object} customConfig - Optional configuration overrides
 * @returns {Promise<express.Application>} Express app instance
 */
export async function startServer(customConfig = {}) {
  const startTime = Date.now();
  const serverConfig = { ...config, ...customConfig };
  
  console.log('🚀 Starting Racing Data API...');
  console.log(`Environment: ${serverConfig.env}`);
  console.log(`Port: ${serverConfig.port}`);
  console.log(`Database: ${serverConfig.dbPath}`);
  console.log(`Cache enabled: ${serverConfig.cacheEnabled}`);
  console.log(`CORS origins: ${serverConfig.corsOrigins.join(', ')}`);
  
  try {
    // Initialize database connection
    console.log('📊 Initializing database...');
    db = initializeDatabase(serverConfig.dbPath);
    console.log('✅ Database initialized');
    
    // Initialize cache manager
    if (serverConfig.cacheEnabled) {
      console.log('💾 Initializing cache...');
      cache = new CacheManager(serverConfig.cacheTTL);
      console.log('✅ Cache initialized');
      
      // Pre-warm cache with common data
      console.log('🔥 Pre-warming cache...');
      await preWarmCache(db, cache);
      console.log('✅ Cache pre-warmed');
    } else {
      cache = null;
    }
    
    // Create Express app
    const app = express();
    
    // Store db and cache in app locals for access in routes
    app.locals.db = db;
    app.locals.cache = cache;
    app.locals.config = serverConfig;
    
    // Register middleware
    app.use(corsConfig(serverConfig.corsOrigins));
    app.use(express.json());
    app.use(requestLogger);
    
    // Register routes
    app.use('/api/vehicles', vehiclesRouter);
    app.use('/api/lap-times', lapTimesRouter);
    app.use('/api/telemetry', telemetryRouter);
    app.use('/api/results', resultsRouter);
    app.use('/api/sections', sectionsRouter);
    app.use('/api/weather', weatherRouter);
    app.use('/api/statistics', statisticsRouter);
    app.use('/api/health', healthRouter);
    
    // Root endpoint
    app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Racing Data API',
        version: '1.0.0',
        endpoints: {
          vehicles: '/api/vehicles',
          lapTimes: '/api/lap-times',
          telemetry: '/api/telemetry',
          results: '/api/results',
          sections: '/api/sections',
          weather: '/api/weather',
          statistics: '/api/statistics',
          health: '/api/health'
        }
      });
    });
    
    // Register error handler (must be last)
    app.use(errorHandler);
    
    // Start listening
    await new Promise((resolve) => {
      server = app.listen(serverConfig.port, serverConfig.host, () => {
        const elapsed = Date.now() - startTime;
        console.log(`✅ Server started in ${elapsed}ms`);
        console.log(`🌐 Listening on http://${serverConfig.host}:${serverConfig.port}`);
        console.log(`📚 API documentation: http://${serverConfig.host}:${serverConfig.port}/`);
        resolve();
      });
    });
    
    // Setup graceful shutdown handlers
    setupGracefulShutdown(server, db, cache);
    
    return app;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    throw error;
  }
}

/**
 * Pre-warm cache with frequently accessed data
 * @param {Database} db - Database connection
 * @param {CacheManager} cache - Cache manager instance
 */
async function preWarmCache(db, cache) {
  try {
    // Cache all vehicles
    const vehicles = getAllVehicles(db);
    cache.set('vehicles:all', vehicles, 1800); // 30 minutes
    console.log(`  - Cached ${vehicles.length} vehicles`);
    
    // Cache race results
    const results = getAllResults(db);
    cache.set('results:all', results, 1800); // 30 minutes
    console.log(`  - Cached ${results.length} race results`);
    
    // Cache overview statistics
    const stats = getOverviewStatistics(db);
    cache.set('stats:overview', stats, 600); // 10 minutes
    console.log(`  - Cached overview statistics`);
    
  } catch (error) {
    console.warn('⚠️  Cache pre-warming failed (non-fatal):', error.message);
  }
}

/**
 * Setup graceful shutdown handlers
 * @param {Server} server - HTTP server instance
 * @param {Database} db - Database connection
 * @param {CacheManager} cache - Cache manager instance
 */
function setupGracefulShutdown(server, db, cache) {
  const shutdown = async (signal) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    
    // Stop accepting new connections
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
    
    // Close database connection
    if (db) {
      try {
        db.close();
        console.log('✅ Database connection closed');
      } catch (error) {
        console.error('❌ Error closing database:', error);
      }
    }
    
    // Clear cache
    if (cache) {
      try {
        cache.flush();
        console.log('✅ Cache cleared');
      } catch (error) {
        console.error('❌ Error clearing cache:', error);
      }
    }
    
    console.log('👋 Goodbye!');
    process.exit(0);
  };
  
  // Handle shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
}

/**
 * Graceful shutdown function (can be called programmatically)
 * @returns {Promise<void>}
 */
export async function gracefulShutdown() {
  return new Promise((resolve) => {
    if (!server) {
      resolve();
      return;
    }
    
    server.close(() => {
      if (db) {
        try {
          db.close();
        } catch (error) {
          console.error('Error closing database:', error);
        }
      }
      
      if (cache) {
        try {
          cache.flush();
        } catch (error) {
          console.error('Error clearing cache:', error);
        }
      }
      
      resolve();
    });
  });
}

// Start server if this file is run directly
// Handle both Unix and Windows paths
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMainModule) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
