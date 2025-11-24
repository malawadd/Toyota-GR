import express from 'express';
import { createError } from '../middleware/error-handler.js';

const router = express.Router();

// Track server start time for uptime calculation
const serverStartTime = Date.now();

/**
 * GET /api/health
 * Health check endpoint
 * Returns:
 *   - System status
 *   - Database connectivity
 *   - Cache statistics
 *   - System uptime
 */
router.get('/', (req, res, next) => {
  try {
    const { db, cache } = req.app.locals;
    
    // Check database connectivity
    let dbStatus = 'disconnected';
    let dbError = null;
    
    try {
      // Simple query to test database connection
      const result = db.prepare('SELECT 1 as test').get();
      dbStatus = result && result.test === 1 ? 'connected' : 'error';
    } catch (error) {
      dbStatus = 'error';
      dbError = error.message;
    }

    // Get cache statistics
    const cacheStats = cache.getStats();

    // Calculate uptime
    const uptimeMs = Date.now() - serverStartTime;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    const uptimeDays = Math.floor(uptimeHours / 24);

    const uptime = {
      milliseconds: uptimeMs,
      seconds: uptimeSeconds,
      formatted: `${uptimeDays}d ${uptimeHours % 24}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`
    };

    // Determine overall status
    const status = dbStatus === 'connected' ? 'healthy' : 'unhealthy';

    const healthData = {
      status,
      timestamp: new Date().toISOString(),
      uptime,
      database: {
        status: dbStatus,
        error: dbError
      },
      cache: {
        enabled: true,
        keys: cacheStats.keys,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: cacheStats.hitRate
      },
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) // MB
      }
    };

    // Return 200 if healthy, 503 if unhealthy
    const statusCode = status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      success: status === 'healthy',
      data: healthData
    });
  } catch (error) {
    next(createError('HEALTH_CHECK_ERROR', 'Failed to perform health check', { originalError: error.message }));
  }
});

export default router;
