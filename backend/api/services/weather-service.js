/**
 * Weather Service
 * Business logic for weather data queries and analysis
 */

/**
 * Get weather data with optional time range filtering
 * @param {Database} db - Database connection
 * @param {Object} options - Query options
 * @param {string} options.startTime - Start timestamp (ISO format)
 * @param {string} options.endTime - End timestamp (ISO format)
 * @param {number} options.limit - Maximum records to return (default: 100)
 * @param {number} options.offset - Number of records to skip (default: 0)
 * @returns {Object} - { data: Array<Weather>, total: number }
 */
function getWeatherData(db, options = {}) {
  const {
    startTime = null,
    endTime = null,
    limit = 100,
    offset = 0
  } = options;

  // Build query with optional time range filtering
  let sql = 'SELECT * FROM weather WHERE 1=1';
  const params = [];

  // Add time range filters
  if (startTime !== null) {
    sql += ' AND timestamp >= ?';
    params.push(startTime);
  }

  if (endTime !== null) {
    sql += ' AND timestamp <= ?';
    params.push(endTime);
  }

  // Order by timestamp
  sql += ' ORDER BY timestamp ASC';

  // Add pagination
  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  // Execute query with prepared statement
  const stmt = db.prepare(sql);
  const data = stmt.all(...params);

  // Get total count for pagination metadata
  let countSql = 'SELECT COUNT(*) as total FROM weather WHERE 1=1';
  const countParams = [];

  if (startTime !== null) {
    countSql += ' AND timestamp >= ?';
    countParams.push(startTime);
  }

  if (endTime !== null) {
    countSql += ' AND timestamp <= ?';
    countParams.push(endTime);
  }

  const countStmt = db.prepare(countSql);
  const { total } = countStmt.get(...countParams);

  return { data, total };
}

/**
 * Get weather summary with aggregations
 * @param {Database} db - Database connection
 * @param {Object} options - Query options
 * @param {string} options.startTime - Start timestamp (ISO format)
 * @param {string} options.endTime - End timestamp (ISO format)
 * @returns {Object} - Aggregated weather statistics
 */
function getWeatherSummary(db, options = {}) {
  const {
    startTime = null,
    endTime = null
  } = options;

  // Build query for aggregated statistics
  let sql = `
    SELECT 
      COUNT(*) as count,
      AVG(air_temp) as avgAirTemp,
      MIN(air_temp) as minAirTemp,
      MAX(air_temp) as maxAirTemp,
      AVG(track_temp) as avgTrackTemp,
      MIN(track_temp) as minTrackTemp,
      MAX(track_temp) as maxTrackTemp,
      AVG(humidity) as avgHumidity,
      AVG(pressure) as avgPressure,
      AVG(wind_speed) as avgWindSpeed,
      MAX(wind_speed) as maxWindSpeed,
      SUM(CASE WHEN rain > 0 THEN 1 ELSE 0 END) as rainMeasurements,
      MAX(rain) as maxRain
    FROM weather
    WHERE 1=1
  `;
  const params = [];

  // Add time range filters
  if (startTime !== null) {
    sql += ' AND timestamp >= ?';
    params.push(startTime);
  }

  if (endTime !== null) {
    sql += ' AND timestamp <= ?';
    params.push(endTime);
  }

  const stmt = db.prepare(sql);
  const summary = stmt.get(...params);

  if (summary.count === 0) {
    return null;
  }

  return {
    count: summary.count,
    airTemp: {
      average: summary.avgAirTemp,
      min: summary.minAirTemp,
      max: summary.maxAirTemp
    },
    trackTemp: {
      average: summary.avgTrackTemp,
      min: summary.minTrackTemp,
      max: summary.maxTrackTemp
    },
    humidity: {
      average: summary.avgHumidity
    },
    pressure: {
      average: summary.avgPressure
    },
    wind: {
      averageSpeed: summary.avgWindSpeed,
      maxSpeed: summary.maxWindSpeed
    },
    rain: {
      measurements: summary.rainMeasurements,
      maxIntensity: summary.maxRain
    }
  };
}

/**
 * Get rain periods (time ranges when rain occurred)
 * @param {Database} db - Database connection
 * @param {Object} options - Query options
 * @param {number} options.minRain - Minimum rain value to consider (default: 0)
 * @returns {Array<Object>} - Array of rain period objects with start/end times
 */
function getRainPeriods(db, options = {}) {
  const {
    minRain = 0
  } = options;

  // Query all weather records with rain
  const sql = `
    SELECT timestamp, rain
    FROM weather
    WHERE rain > ?
    ORDER BY timestamp ASC
  `;

  const stmt = db.prepare(sql);
  const rainRecords = stmt.all(minRain);

  if (rainRecords.length === 0) {
    return [];
  }

  // Group consecutive rain measurements into periods
  const periods = [];
  let currentPeriod = {
    startTime: rainRecords[0].timestamp,
    endTime: rainRecords[0].timestamp,
    maxIntensity: rainRecords[0].rain,
    measurements: 1
  };

  for (let i = 1; i < rainRecords.length; i++) {
    const record = rainRecords[i];
    const prevRecord = rainRecords[i - 1];

    // Calculate time difference (assuming timestamps are ISO strings)
    const currentTime = new Date(record.timestamp);
    const prevTime = new Date(prevRecord.timestamp);
    const timeDiffMinutes = (currentTime - prevTime) / (1000 * 60);

    // If gap is more than 10 minutes, start a new period
    if (timeDiffMinutes > 10) {
      periods.push(currentPeriod);
      currentPeriod = {
        startTime: record.timestamp,
        endTime: record.timestamp,
        maxIntensity: record.rain,
        measurements: 1
      };
    } else {
      // Extend current period
      currentPeriod.endTime = record.timestamp;
      currentPeriod.maxIntensity = Math.max(currentPeriod.maxIntensity, record.rain);
      currentPeriod.measurements++;
    }
  }

  // Add the last period
  periods.push(currentPeriod);

  return periods;
}

/**
 * Get weather at a specific time (nearest measurement)
 * @param {Database} db - Database connection
 * @param {string} targetTime - Target timestamp (ISO format)
 * @returns {Object|null} - Weather record closest to target time, or null if no data
 */
function getWeatherAtTime(db, targetTime) {
  // Query to find the nearest weather measurement
  // Uses ABS to find the smallest time difference
  const sql = `
    SELECT *,
      ABS(julianday(timestamp) - julianday(?)) as time_diff
    FROM weather
    ORDER BY time_diff ASC
    LIMIT 1
  `;

  const stmt = db.prepare(sql);
  const weather = stmt.get(targetTime);

  if (!weather) {
    return null;
  }

  // Remove the time_diff field from the result
  delete weather.time_diff;

  return weather;
}

export {
  getWeatherData,
  getWeatherSummary,
  getRainPeriods,
  getWeatherAtTime
};
