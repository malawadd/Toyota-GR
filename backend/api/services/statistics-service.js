/**
 * Statistics Service
 * Business logic for aggregated statistics and leaderboards
 */

/**
 * Get overview statistics for the entire race
 * @param {Database} db - Database connection
 * @returns {Object} - Race-wide statistics
 */
function getOverviewStatistics(db) {
  // Get vehicle statistics
  const vehicleStats = db.prepare(`
    SELECT 
      COUNT(*) as totalVehicles,
      MIN(fastest_lap) as fastestLap,
      AVG(average_lap) as averageLap,
      MAX(max_speed) as maxSpeed
    FROM vehicles
  `).get();

  // Get total laps across all vehicles
  const lapStats = db.prepare(`
    SELECT COUNT(*) as totalLaps
    FROM lap_times
  `).get();

  // Get telemetry record count
  const telemetryStats = db.prepare(`
    SELECT COUNT(*) as totalTelemetryRecords
    FROM telemetry
  `).get();

  // Get class distribution
  const classDistribution = db.prepare(`
    SELECT class, COUNT(*) as count
    FROM vehicles
    GROUP BY class
    ORDER BY class
  `).all();

  return {
    totalVehicles: vehicleStats.totalVehicles,
    totalLaps: lapStats.totalLaps,
    totalTelemetryRecords: telemetryStats.totalTelemetryRecords,
    fastestLap: vehicleStats.fastestLap,
    averageLap: vehicleStats.averageLap,
    maxSpeed: vehicleStats.maxSpeed,
    classDist: classDistribution
  };
}

/**
 * Get pre-computed statistics for a specific vehicle
 * @param {Database} db - Database connection
 * @param {string} vehicleId - Vehicle ID
 * @returns {Object|null} - Vehicle statistics or null if not found
 */
function getVehicleStatistics(db, vehicleId) {
  // Get vehicle with pre-aggregated statistics
  const vehicle = db.prepare(`
    SELECT * FROM vehicles WHERE vehicle_id = ?
  `).get(vehicleId);

  if (!vehicle) {
    return null;
  }

  // Get additional lap-based statistics
  const lapStats = db.prepare(`
    SELECT 
      COUNT(*) as lapCount,
      MIN(lap_time) as fastestLap,
      MAX(lap_time) as slowestLap,
      AVG(lap_time) as averageLap
    FROM lap_times
    WHERE vehicle_id = ?
  `).get(vehicleId);

  // Get section statistics if available
  const sectionStats = db.prepare(`
    SELECT 
      MIN(s1) as fastestS1,
      MIN(s2) as fastestS2,
      MIN(s3) as fastestS3,
      AVG(s1) as avgS1,
      AVG(s2) as avgS2,
      AVG(s3) as avgS3
    FROM section_times
    WHERE vehicle_id = ?
  `).get(vehicleId);

  return {
    vehicleId: vehicle.vehicle_id,
    carNumber: vehicle.car_number,
    class: vehicle.class,
    position: vehicle.position,
    statistics: {
      fastestLap: vehicle.fastest_lap,
      averageLap: vehicle.average_lap,
      slowestLap: lapStats.slowestLap,
      totalLaps: vehicle.total_laps,
      maxSpeed: vehicle.max_speed,
      sections: sectionStats.fastestS1 ? {
        fastestS1: sectionStats.fastestS1,
        fastestS2: sectionStats.fastestS2,
        fastestS3: sectionStats.fastestS3,
        avgS1: sectionStats.avgS1,
        avgS2: sectionStats.avgS2,
        avgS3: sectionStats.avgS3
      } : null
    }
  };
}

/**
 * Get leaderboard with sorting options
 * @param {Database} db - Database connection
 * @param {Object} options - Query options
 * @param {string} options.sortBy - Sort field (fastest_lap, average_lap, max_speed, position)
 * @param {string} options.order - Sort order (asc, desc)
 * @param {string} options.class - Optional filter by vehicle class
 * @param {number} options.limit - Maximum records to return (default: 50)
 * @returns {Array<Object>} - Array of ranked vehicles
 */
function getLeaderboard(db, options = {}) {
  const {
    sortBy = 'fastest_lap',
    order = 'asc',
    class: vehicleClass = null,
    limit = 50
  } = options;

  // Validate sort field
  const validSortFields = ['fastest_lap', 'average_lap', 'max_speed', 'position', 'total_laps'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'fastest_lap';
  
  // Validate sort order
  const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  // Build query
  let sql = `
    SELECT 
      vehicle_id,
      car_number,
      class,
      position,
      fastest_lap,
      average_lap,
      total_laps,
      max_speed
    FROM vehicles
  `;
  const params = [];

  // Add class filter if specified
  if (vehicleClass) {
    sql += ' WHERE class = ?';
    params.push(vehicleClass);
  }

  // Add sorting and limit
  sql += ` ORDER BY ${sortField} ${sortOrder} LIMIT ?`;
  params.push(limit);

  const stmt = db.prepare(sql);
  const leaderboard = stmt.all(...params);

  // Add rank based on the sort order
  return leaderboard.map((vehicle, index) => ({
    rank: index + 1,
    vehicleId: vehicle.vehicle_id,
    carNumber: vehicle.car_number,
    class: vehicle.class,
    position: vehicle.position,
    fastestLap: vehicle.fastest_lap,
    averageLap: vehicle.average_lap,
    totalLaps: vehicle.total_laps,
    maxSpeed: vehicle.max_speed
  }));
}

export {
  getOverviewStatistics,
  getVehicleStatistics,
  getLeaderboard
};
