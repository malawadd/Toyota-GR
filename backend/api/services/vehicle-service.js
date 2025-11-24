/**
 * Vehicle Service
 * Business logic for vehicle queries and statistics
 */

/**
 * Get all vehicles with optional filtering
 * @param {Database} db - Database connection
 * @param {Object} filters - Optional filters
 * @param {string} filters.class - Filter by vehicle class
 * @param {string} filters.sortBy - Sort field (fastest_lap, average_lap, position)
 * @param {string} filters.order - Sort order (asc, desc)
 * @returns {Array<Object>} - Array of vehicle objects
 */
function getAllVehicles(db, filters = {}) {
  const vehicleClass = filters.class;
  const sortBy = filters.sortBy || 'position';
  const order = filters.order || 'asc';

  // Build query with optional class filter
  let sql = 'SELECT * FROM vehicles';
  const params = [];

  if (vehicleClass) {
    sql += ' WHERE class = ?';
    params.push(vehicleClass);
  }

  // Add sorting
  const validSortFields = ['fastest_lap', 'average_lap', 'position', 'car_number', 'max_speed'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'position';
  const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  sql += ` ORDER BY ${sortField} ${sortOrder}`;

  // Use prepared statement
  const stmt = db.prepare(sql);
  const vehicles = stmt.all(...params);

  return vehicles;
}

/**
 * Get vehicle by ID
 * @param {Database} db - Database connection
 * @param {string} vehicleId - Vehicle ID (e.g., 'GR86-004-78')
 * @returns {Object|null} - Vehicle object or null if not found
 */
function getVehicleById(db, vehicleId) {
  const stmt = db.prepare('SELECT * FROM vehicles WHERE vehicle_id = ?');
  const vehicle = stmt.get(vehicleId);
  return vehicle || null;
}

/**
 * Get vehicle by car number with resolution logic
 * @param {Database} db - Database connection
 * @param {number} carNumber - Car number
 * @returns {Object|null} - Vehicle object or null if not found
 */
function getVehicleByCarNumber(db, carNumber) {
  const stmt = db.prepare('SELECT * FROM vehicles WHERE car_number = ?');
  const vehicle = stmt.get(carNumber);
  return vehicle || null;
}

/**
 * Get vehicle statistics
 * @param {Database} db - Database connection
 * @param {string} vehicleId - Vehicle ID
 * @returns {Object|null} - Vehicle statistics object or null if not found
 */
function getVehicleStatistics(db, vehicleId) {
  // Get vehicle data which includes pre-aggregated statistics
  const vehicle = getVehicleById(db, vehicleId);
  
  if (!vehicle) {
    return null;
  }

  // Return statistics in a structured format
  return {
    vehicleId: vehicle.vehicle_id,
    carNumber: vehicle.car_number,
    class: vehicle.class,
    statistics: {
      fastestLap: vehicle.fastest_lap,
      averageLap: vehicle.average_lap,
      totalLaps: vehicle.total_laps,
      maxSpeed: vehicle.max_speed,
      position: vehicle.position
    }
  };
}

export {
  getAllVehicles,
  getVehicleById,
  getVehicleByCarNumber,
  getVehicleStatistics
};
