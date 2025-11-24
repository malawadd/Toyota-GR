/**
 * Lap Service
 * Business logic for lap time queries and analysis
 */

/**
 * Get lap times for a vehicle with optional range filtering
 * @param {Database} db - Database connection
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} options - Query options
 * @param {number} options.minLap - Minimum lap number (inclusive)
 * @param {number} options.maxLap - Maximum lap number (inclusive)
 * @param {number} options.limit - Maximum records to return (default: 100)
 * @param {number} options.offset - Number of records to skip (default: 0)
 * @returns {Object} - { data: Array<Lap>, total: number }
 */
function getLapsByVehicle(db, vehicleId, options = {}) {
  const {
    minLap = null,
    maxLap = null,
    limit = 100,
    offset = 0
  } = options;

  // Build query with indexed lookups
  let sql = 'SELECT * FROM lap_times WHERE vehicle_id = ?';
  const params = [vehicleId];

  // Add lap range filters
  if (minLap !== null) {
    sql += ' AND lap >= ?';
    params.push(minLap);
  }

  if (maxLap !== null) {
    sql += ' AND lap <= ?';
    params.push(maxLap);
  }

  // Order by lap number
  sql += ' ORDER BY lap ASC';

  // Add pagination
  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  // Execute query with prepared statement
  const stmt = db.prepare(sql);
  const data = stmt.all(...params);

  // Get total count for pagination metadata
  let countSql = 'SELECT COUNT(*) as total FROM lap_times WHERE vehicle_id = ?';
  const countParams = [vehicleId];

  if (minLap !== null) {
    countSql += ' AND lap >= ?';
    countParams.push(minLap);
  }

  if (maxLap !== null) {
    countSql += ' AND lap <= ?';
    countParams.push(maxLap);
  }

  const countStmt = db.prepare(countSql);
  const { total } = countStmt.get(...countParams);

  return { data, total };
}

/**
 * Get fastest laps with sorting and limit
 * @param {Database} db - Database connection
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum records to return (default: 10)
 * @param {string} options.vehicleId - Optional filter by vehicle ID
 * @param {string} options.class - Optional filter by vehicle class
 * @returns {Array<Object>} - Array of lap objects with vehicle information
 */
function getFastestLaps(db, options = {}) {
  const {
    limit = 10,
    vehicleId = null,
    class: vehicleClass = null
  } = options;

  // Build query joining lap_times with vehicles for class filtering
  let sql = `
    SELECT 
      lap_times.*,
      vehicles.car_number,
      vehicles.class
    FROM lap_times
    INNER JOIN vehicles ON lap_times.vehicle_id = vehicles.vehicle_id
    WHERE 1=1
  `;
  const params = [];

  // Add vehicle filter
  if (vehicleId) {
    sql += ' AND lap_times.vehicle_id = ?';
    params.push(vehicleId);
  }

  // Add class filter
  if (vehicleClass) {
    sql += ' AND vehicles.class = ?';
    params.push(vehicleClass);
  }

  // Sort by lap time (fastest first) and limit
  sql += ' ORDER BY lap_times.lap_time ASC LIMIT ?';
  params.push(limit);

  const stmt = db.prepare(sql);
  const laps = stmt.all(...params);

  return laps;
}

/**
 * Compare lap times for multiple vehicles
 * @param {Database} db - Database connection
 * @param {Array<string>} vehicleIds - Array of vehicle IDs to compare
 * @param {Object} options - Query options
 * @param {number} options.minLap - Minimum lap number (inclusive)
 * @param {number} options.maxLap - Maximum lap number (inclusive)
 * @returns {Object} - Map of vehicleId to array of laps
 */
function compareLaps(db, vehicleIds, options = {}) {
  const {
    minLap = null,
    maxLap = null
  } = options;

  if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
    return {};
  }

  // Build query with IN clause for multiple vehicles
  const placeholders = vehicleIds.map(() => '?').join(',');
  let sql = `SELECT * FROM lap_times WHERE vehicle_id IN (${placeholders})`;
  const params = [...vehicleIds];

  // Add lap range filters
  if (minLap !== null) {
    sql += ' AND lap >= ?';
    params.push(minLap);
  }

  if (maxLap !== null) {
    sql += ' AND lap <= ?';
    params.push(maxLap);
  }

  // Order by vehicle and lap
  sql += ' ORDER BY vehicle_id, lap ASC';

  const stmt = db.prepare(sql);
  const allLaps = stmt.all(...params);

  // Group laps by vehicle ID
  const result = {};
  for (const vehicleId of vehicleIds) {
    result[vehicleId] = allLaps.filter(lap => lap.vehicle_id === vehicleId);
  }

  return result;
}

/**
 * Get lap time statistics for a vehicle
 * @param {Database} db - Database connection
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} options - Query options
 * @param {number} options.minLap - Minimum lap number (inclusive)
 * @param {number} options.maxLap - Maximum lap number (inclusive)
 * @returns {Object|null} - Statistics object or null if no laps found
 */
function getLapStatistics(db, vehicleId, options = {}) {
  const {
    minLap = null,
    maxLap = null
  } = options;

  // Build query for statistics
  let sql = `
    SELECT 
      COUNT(*) as count,
      MIN(lap_time) as fastest,
      MAX(lap_time) as slowest,
      AVG(lap_time) as average
    FROM lap_times
    WHERE vehicle_id = ?
  `;
  const params = [vehicleId];

  // Add lap range filters
  if (minLap !== null) {
    sql += ' AND lap >= ?';
    params.push(minLap);
  }

  if (maxLap !== null) {
    sql += ' AND lap <= ?';
    params.push(maxLap);
  }

  const stmt = db.prepare(sql);
  const stats = stmt.get(...params);

  if (stats.count === 0) {
    return null;
  }

  // Calculate standard deviation
  let stdDevSql = `
    SELECT 
      AVG((lap_time - ?) * (lap_time - ?)) as variance
    FROM lap_times
    WHERE vehicle_id = ?
  `;
  const stdDevParams = [stats.average, stats.average, vehicleId];

  if (minLap !== null) {
    stdDevSql += ' AND lap >= ?';
    stdDevParams.push(minLap);
  }

  if (maxLap !== null) {
    stdDevSql += ' AND lap <= ?';
    stdDevParams.push(maxLap);
  }

  const stdDevStmt = db.prepare(stdDevSql);
  const { variance } = stdDevStmt.get(...stdDevParams);
  const standardDeviation = variance ? Math.sqrt(variance) : 0;

  return {
    count: stats.count,
    fastest: stats.fastest,
    slowest: stats.slowest,
    average: stats.average,
    standardDeviation
  };
}

export {
  getLapsByVehicle,
  getFastestLaps,
  compareLaps,
  getLapStatistics
};
