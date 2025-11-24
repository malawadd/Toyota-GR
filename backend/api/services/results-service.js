/**
 * Results Service
 * Business logic for race results queries
 */

/**
 * Get all race results with optional class filtering
 * @param {Database} db - Database connection
 * @param {Object} filters - Optional filters
 * @param {string} filters.class - Filter by vehicle class
 * @param {string} filters.sortBy - Sort field (position, laps, car_number)
 * @param {string} filters.order - Sort order (asc, desc)
 * @returns {Array<Object>} - Array of race result objects
 */
function getAllResults(db, filters = {}) {
  const vehicleClass = filters.class;
  const sortBy = filters.sortBy || 'position';
  const order = filters.order || 'asc';

  // Build query with optional class filter
  let sql = 'SELECT * FROM race_results';
  const params = [];

  if (vehicleClass) {
    sql += ' WHERE class = ?';
    params.push(vehicleClass);
  }

  // Add sorting
  const validSortFields = ['position', 'laps', 'car_number', 'class'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'position';
  const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  sql += ` ORDER BY ${sortField} ${sortOrder}`;

  // Use prepared statement
  const stmt = db.prepare(sql);
  const results = stmt.all(...params);

  return results;
}

/**
 * Get race result for a specific vehicle
 * @param {Database} db - Database connection
 * @param {string} vehicleId - Vehicle ID (e.g., 'GR86-004-78')
 * @returns {Object|null} - Race result object or null if not found
 */
function getResultByVehicle(db, vehicleId) {
  const stmt = db.prepare('SELECT * FROM race_results WHERE vehicle_id = ?');
  const result = stmt.get(vehicleId);
  return result || null;
}

/**
 * Get race results filtered by class
 * @param {Database} db - Database connection
 * @param {string} vehicleClass - Vehicle class (e.g., 'Pro', 'Am')
 * @param {Object} options - Query options
 * @param {string} options.sortBy - Sort field (position, laps, car_number)
 * @param {string} options.order - Sort order (asc, desc)
 * @returns {Array<Object>} - Array of race result objects for the specified class
 */
function getResultsByClass(db, vehicleClass, options = {}) {
  const sortBy = options.sortBy || 'position';
  const order = options.order || 'asc';

  // Build query with class filter
  let sql = 'SELECT * FROM race_results WHERE class = ?';
  const params = [vehicleClass];

  // Add sorting
  const validSortFields = ['position', 'laps', 'car_number'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'position';
  const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  sql += ` ORDER BY ${sortField} ${sortOrder}`;

  // Use prepared statement
  const stmt = db.prepare(sql);
  const results = stmt.all(...params);

  return results;
}

export {
  getAllResults,
  getResultByVehicle,
  getResultsByClass
};
