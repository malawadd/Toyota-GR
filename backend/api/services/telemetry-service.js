/**
 * Telemetry Service
 * Business logic for telemetry queries with performance optimization
 * Critical for sub-100ms response times
 */

/**
 * Get telemetry data for a vehicle with filtering and pagination
 * Uses indexed queries for fast results
 * @param {Database} db - Database connection
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} options - Query options
 * @param {number} options.lap - Filter by specific lap number
 * @param {number} options.limit - Maximum records to return (default: 100)
 * @param {number} options.offset - Number of records to skip (default: 0)
 * @param {Array<string>} options.telemetryNames - Filter by telemetry types (e.g., ['speed_can', 'brake'])
 * @returns {Object} - { data: Array<TelemetryRecord>, total: number }
 */
function getTelemetryByVehicle(db, vehicleId, options = {}) {
  const {
    lap = null,
    limit = 100,
    offset = 0,
    telemetryNames = null
  } = options;

  // Build query with indexed lookups
  let sql = 'SELECT * FROM telemetry WHERE vehicle_id = ?';
  const params = [vehicleId];

  // Add lap filter (uses composite index on vehicle_id + lap)
  if (lap !== null) {
    sql += ' AND lap = ?';
    params.push(lap);
  }

  // Add telemetry name filter (uses index on telemetry_name)
  if (telemetryNames && Array.isArray(telemetryNames) && telemetryNames.length > 0) {
    const placeholders = telemetryNames.map(() => '?').join(',');
    sql += ` AND telemetry_name IN (${placeholders})`;
    params.push(...telemetryNames);
  }

  // Order by timestamp for chronological data
  sql += ' ORDER BY timestamp ASC';

  // Add pagination
  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  // Execute query with prepared statement
  const stmt = db.prepare(sql);
  const data = stmt.all(...params);

  // Get total count for pagination metadata
  let countSql = 'SELECT COUNT(*) as total FROM telemetry WHERE vehicle_id = ?';
  const countParams = [vehicleId];

  if (lap !== null) {
    countSql += ' AND lap = ?';
    countParams.push(lap);
  }

  if (telemetryNames && Array.isArray(telemetryNames) && telemetryNames.length > 0) {
    const placeholders = telemetryNames.map(() => '?').join(',');
    countSql += ` AND telemetry_name IN (${placeholders})`;
    countParams.push(...telemetryNames);
  }

  const countStmt = db.prepare(countSql);
  const { total } = countStmt.get(...countParams);

  return { data, total };
}

/**
 * Get aggregated telemetry statistics for a vehicle
 * Returns pre-computed statistics for fast response
 * @param {Database} db - Database connection
 * @param {string} vehicleId - Vehicle ID
 * @param {number|null} lap - Optional lap number to filter by
 * @returns {Object|null} - Aggregated statistics or null if no data
 */
function getAggregatedTelemetry(db, vehicleId, lap = null) {
  // Build query for aggregated statistics
  let sql = `
    SELECT 
      telemetry_name,
      COUNT(*) as count,
      MIN(telemetry_value) as min_value,
      MAX(telemetry_value) as max_value,
      AVG(telemetry_value) as avg_value
    FROM telemetry
    WHERE vehicle_id = ?
  `;
  const params = [vehicleId];

  if (lap !== null) {
    sql += ' AND lap = ?';
    params.push(lap);
  }

  sql += ' GROUP BY telemetry_name';

  const stmt = db.prepare(sql);
  const results = stmt.all(...params);

  if (results.length === 0) {
    return null;
  }

  // Transform results into a more usable format
  const stats = {};
  for (const row of results) {
    stats[row.telemetry_name] = {
      count: row.count,
      min: row.min_value,
      max: row.max_value,
      avg: row.avg_value
    };
  }

  return stats;
}

/**
 * Stream telemetry data for a vehicle
 * Returns an async generator for large datasets
 * Used for Server-Sent Events (SSE) streaming
 * @param {Database} db - Database connection
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} options - Query options
 * @param {number} options.lap - Filter by specific lap number
 * @param {Array<string>} options.telemetryNames - Filter by telemetry types
 * @param {number} options.batchSize - Number of records per batch (default: 1000)
 * @returns {AsyncGenerator<Array<TelemetryRecord>>} - Async generator yielding batches
 */
async function* getTelemetryStream(db, vehicleId, options = {}) {
  const {
    lap = null,
    telemetryNames = null,
    batchSize = 1000
  } = options;

  // Build query
  let sql = 'SELECT * FROM telemetry WHERE vehicle_id = ?';
  const params = [vehicleId];

  if (lap !== null) {
    sql += ' AND lap = ?';
    params.push(lap);
  }

  if (telemetryNames && Array.isArray(telemetryNames) && telemetryNames.length > 0) {
    const placeholders = telemetryNames.map(() => '?').join(',');
    sql += ` AND telemetry_name IN (${placeholders})`;
    params.push(...telemetryNames);
  }

  // Order by timestamp for chronological streaming
  sql += ' ORDER BY timestamp ASC';

  // Use pagination to stream in batches
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const batchSql = sql + ' LIMIT ? OFFSET ?';
    const batchParams = [...params, batchSize, offset];

    const stmt = db.prepare(batchSql);
    const batch = stmt.all(...batchParams);

    if (batch.length === 0) {
      hasMore = false;
    } else {
      yield batch;
      offset += batchSize;
      hasMore = batch.length === batchSize;
    }
  }
}

export {
  getTelemetryByVehicle,
  getAggregatedTelemetry,
  getTelemetryStream
};
