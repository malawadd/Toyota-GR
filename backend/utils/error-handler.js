/**
 * Global error handler for the application
 * Catches unexpected errors, logs them, and exits gracefully
 */

/**
 * Setup global error handlers
 */
export function setupErrorHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('[ERROR] Uncaught Exception:');
    console.error(error.stack || error.message);
    console.error('[ERROR] Application will exit');
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[ERROR] Unhandled Promise Rejection:');
    console.error('Promise:', promise);
    console.error('Reason:', reason);
    console.error('[ERROR] Application will exit');
    process.exit(1);
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('\n[INFO] Received SIGINT, shutting down gracefully...');
    process.exit(0);
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    console.log('\n[INFO] Received SIGTERM, shutting down gracefully...');
    process.exit(0);
  });
}

/**
 * Wrap an async function with error handling
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('[ERROR] Operation failed:');
      console.error(error.stack || error.message);
      throw error;
    }
  };
}
