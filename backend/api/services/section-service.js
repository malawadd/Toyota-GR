/**
 * Section Service
 * Business logic for section timing queries and analysis
 */

/**
 * Get section times for a vehicle with optional lap filtering
 * @param {Database} db - Database connection
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} options - Query options
 * @param {number} options.lap - Filter by specific lap number
 * @param {number} options.minLap - Minimum lap number (inclusive)
 * @param {number} options.maxLap - Maximum lap number (inclusive)
 * @param {number} options.limit - Maximum records to return (default: 100)
 * @param {number} options.offset - Number of records to skip (default: 0)
 * @returns {Object} - { data: Array<Section>, total: number }
 */
function getSectionsByVehicle(db, vehicleId, options = {}) {
  const {
    lap = null,
    minLap = null,
    maxLap = null,
    limit = 100,
    offset = 0
  } = options;

  // Build query with indexed lookups
  let sql = 'SELECT * FROM section_times WHERE vehicle_id = ?';
  const params = [vehicleId];

  // Add specific lap filter
  if (lap !== null) {
    sql += ' AND lap = ?';
    params.push(lap);
  } else {
    // Add lap range filters if no specific lap
    if (minLap !== null) {
      sql += ' AND lap >= ?';
      params.push(minLap);
    }

    if (maxLap !== null) {
      sql += ' AND lap <= ?';
      params.push(maxLap);
    }
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
  let countSql = 'SELECT COUNT(*) as total FROM section_times WHERE vehicle_id = ?';
  const countParams = [vehicleId];

  if (lap !== null) {
    countSql += ' AND lap = ?';
    countParams.push(lap);
  } else {
    if (minLap !== null) {
      countSql += ' AND lap >= ?';
      countParams.push(minLap);
    }

    if (maxLap !== null) {
      countSql += ' AND lap <= ?';
      countParams.push(maxLap);
    }
  }

  const countStmt = db.prepare(countSql);
  const { total } = countStmt.get(...countParams);

  return { data, total };
}

/**
 * Get fastest section times across all vehicles or filtered by options
 * @param {Database} db - Database connection
 * @param {Object} options - Query options
 * @param {string} options.section - Section to query ('s1', 's2', 's3')
 * @param {string} options.vehicleId - Optional filter by vehicle ID
 * @param {string} options.class - Optional filter by vehicle class
 * @param {number} options.limit - Maximum records to return (default: 10)
 * @returns {Array<Object>} - Array of section time objects with vehicle information
 */
function getFastestSectionTimes(db, options = {}) {
  const {
    section = 's1',
    vehicleId = null,
    class: vehicleClass = null,
    limit = 10
  } = options;

  // Validate section parameter
  const validSections = ['s1', 's2', 's3'];
  const sectionField = validSections.includes(section) ? section : 's1';

  // Build query joining section_times with vehicles for class filtering
  let sql = `
    SELECT 
      section_times.*,
      vehicles.car_number,
      vehicles.class
    FROM section_times
    INNER JOIN vehicles ON section_times.vehicle_id = vehicles.vehicle_id
    WHERE section_times.${sectionField} IS NOT NULL
  `;
  const params = [];

  // Add vehicle filter
  if (vehicleId) {
    sql += ' AND section_times.vehicle_id = ?';
    params.push(vehicleId);
  }

  // Add class filter
  if (vehicleClass) {
    sql += ' AND vehicles.class = ?';
    params.push(vehicleClass);
  }

  // Sort by section time (fastest first) and limit
  sql += ` ORDER BY section_times.${sectionField} ASC LIMIT ?`;
  params.push(limit);

  const stmt = db.prepare(sql);
  const sections = stmt.all(...params);

  return sections;
}

/**
 * Compare section times for multiple vehicles
 * @param {Database} db - Database connection
 * @param {Array<string>} vehicleIds - Array of vehicle IDs to compare
 * @param {Object} options - Query options
 * @param {number} options.lap - Filter by specific lap number
 * @param {number} options.minLap - Minimum lap number (inclusive)
 * @param {number} options.maxLap - Maximum lap number (inclusive)
 * @returns {Object} - Map of vehicleId to array of section times
 */
function compareSections(db, vehicleIds, options = {}) {
  const {
    lap = null,
    minLap = null,
    maxLap = null
  } = options;

  if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
    return {};
  }

  // Build query with IN clause for multiple vehicles
  const placeholders = vehicleIds.map(() => '?').join(',');
  let sql = `SELECT * FROM section_times WHERE vehicle_id IN (${placeholders})`;
  const params = [...vehicleIds];

  // Add specific lap filter
  if (lap !== null) {
    sql += ' AND lap = ?';
    params.push(lap);
  } else {
    // Add lap range filters if no specific lap
    if (minLap !== null) {
      sql += ' AND lap >= ?';
      params.push(minLap);
    }

    if (maxLap !== null) {
      sql += ' AND lap <= ?';
      params.push(maxLap);
    }
  }

  // Order by vehicle and lap
  sql += ' ORDER BY vehicle_id, lap ASC';

  const stmt = db.prepare(sql);
  const allSections = stmt.all(...params);

  // Group sections by vehicle ID
  const result = {};
  for (const vehicleId of vehicleIds) {
    result[vehicleId] = allSections.filter(section => section.vehicle_id === vehicleId);
  }

  return result;
}

/**
 * Get section leaders (fastest vehicle for each section)
 * @param {Database} db - Database connection
 * @param {Object} options - Query options
 * @param {string} options.class - Optional filter by vehicle class
 * @param {number} options.lap - Optional filter by specific lap number
 * @returns {Object} - Object with s1, s2, s3 leaders
 */
function getSectionLeaders(db, options = {}) {
  const {
    class: vehicleClass = null,
    lap = null
  } = options;

  const sections = ['s1', 's2', 's3'];
  const leaders = {};

  for (const section of sections) {
    // Build query to find fastest time for this section
    let sql = `
      SELECT 
        section_times.*,
        vehicles.car_number,
        vehicles.class
      FROM section_times
      INNER JOIN vehicles ON section_times.vehicle_id = vehicles.vehicle_id
      WHERE section_times.${section} IS NOT NULL
    `;
    const params = [];

    // Add class filter
    if (vehicleClass) {
      sql += ' AND vehicles.class = ?';
      params.push(vehicleClass);
    }

    // Add lap filter
    if (lap !== null) {
      sql += ' AND section_times.lap = ?';
      params.push(lap);
    }

    // Sort by section time and get the fastest
    sql += ` ORDER BY section_times.${section} ASC LIMIT 1`;

    const stmt = db.prepare(sql);
    const leader = stmt.get(...params);

    leaders[section] = leader || null;
  }

  return leaders;
}

export {
  getSectionsByVehicle,
  getFastestSectionTimes,
  compareSections,
  getSectionLeaders
};
