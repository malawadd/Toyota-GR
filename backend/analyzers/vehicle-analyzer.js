import { min, mean, max } from 'simple-statistics';

/**
 * Parse time string to milliseconds
 * @param {string} timeStr - Time string in format "M:SS.mmm" or "MM:SS.mmm"
 * @returns {number|null} Time in milliseconds or null if invalid
 */
function parseTimeToMs(timeStr) {
  if (!timeStr || timeStr === '') return null;
  
  const parts = timeStr.split(':');
  if (parts.length !== 2) return null;
  
  const minutes = parseInt(parts[0], 10);
  const seconds = parseFloat(parts[1]);
  
  if (isNaN(minutes) || isNaN(seconds)) return null;
  
  return (minutes * 60 + seconds) * 1000;
}

/**
 * Analyze all data for a specific vehicle
 * @param {Object} vehicleData - Object containing all vehicle data from queryVehicle
 * @param {string} vehicleData.vehicleId - Vehicle ID
 * @param {number} vehicleData.carNumber - Car number
 * @param {string} vehicleData.class - Racing class
 * @param {Array<Object>} vehicleData.lapTimes - Lap time records
 * @param {Object} vehicleData.raceResult - Race result record
 * @param {Array<Object>} vehicleData.telemetry - Telemetry records
 * @param {Array<Object>} vehicleData.sections - Section analysis records
 * @returns {Object} Comprehensive vehicle statistics
 */
export function analyzeVehicleData(vehicleData) {
  const {
    vehicleId,
    carNumber,
    class: vehicleClass,
    lapTimes = [],
    raceResult = null,
    telemetry = [],
    sections = []
  } = vehicleData;

  // Initialize result structure
  const analysis = {
    vehicleId,
    carNumber,
    class: vehicleClass,
    lapStatistics: analyzeLapStatistics(lapTimes),
    raceStatistics: analyzeRaceStatistics(raceResult),
    telemetryStatistics: analyzeTelemetryStatistics(telemetry),
    sectionStatistics: analyzeSectionStatistics(sections),
    overallStatistics: null
  };

  // Calculate overall statistics combining all data
  analysis.overallStatistics = calculateOverallStatistics(analysis);

  return analysis;
}

/**
 * Analyze lap time statistics for a vehicle
 * @param {Array<Object>} lapTimes - Lap time records
 * @returns {Object} Lap statistics
 */
function analyzeLapStatistics(lapTimes) {
  if (!lapTimes || lapTimes.length === 0) {
    return {
      totalLaps: 0,
      fastestLap: null,
      averageLap: null,
      slowestLap: null,
      stdDev: null,
      consistency: null,
      lapTimes: []
    };
  }

  const lapValues = lapTimes.map(lt => lt.value);
  const fastestLap = min(lapValues);
  const averageLap = mean(lapValues);
  const slowestLap = max(lapValues);
  
  // Calculate standard deviation
  let stdDev = null;
  if (lapValues.length > 1) {
    const variance = lapValues.reduce((sum, val) => {
      return sum + Math.pow(val - averageLap, 2);
    }, 0) / lapValues.length;
    stdDev = Math.sqrt(variance);
  }

  const consistency = averageLap > 0 ? stdDev / averageLap : null;

  return {
    totalLaps: lapTimes.length,
    fastestLap,
    averageLap,
    slowestLap,
    stdDev,
    consistency,
    lapTimes: lapValues
  };
}

/**
 * Analyze race result statistics for a vehicle
 * @param {Object|null} raceResult - Race result record
 * @returns {Object} Race statistics
 */
function analyzeRaceStatistics(raceResult) {
  if (!raceResult) {
    return {
      position: null,
      totalLaps: 0,
      totalTime: null,
      gapToFirst: null,
      gapToPrevious: null,
      bestLapTime: null
    };
  }

  return {
    position: raceResult.position,
    totalLaps: raceResult.laps,
    totalTime: raceResult.total_time,
    gapToFirst: raceResult.gap_first,
    gapToPrevious: raceResult.gap_previous,
    bestLapTime: raceResult.best_lap_time
  };
}

/**
 * Analyze telemetry statistics for a vehicle
 * @param {Array<Object>} telemetry - Telemetry records
 * @returns {Object} Telemetry statistics
 */
function analyzeTelemetryStatistics(telemetry) {
  if (!telemetry || telemetry.length === 0) {
    return {
      maxSpeed: null,
      avgSpeed: null,
      minSpeed: null,
      maxBrakeFront: null,
      maxBrakeRear: null,
      avgThrottle: null,
      dataPoints: 0
    };
  }

  // Categorize telemetry data by type
  const speeds = [];
  const brakeFront = [];
  const brakeRear = [];
  const throttle = [];

  for (const record of telemetry) {
    const name = record.telemetry_name;
    const value = record.telemetry_value;

    if (name === 'vCar' || name === 'speed_can' || name === 'speed') {
      speeds.push(value);
    } else if (name === 'brake_front' || name === 'brake_front_can') {
      brakeFront.push(value);
    } else if (name === 'brake_rear' || name === 'brake_rear_can') {
      brakeRear.push(value);
    } else if (name === 'throttle' || name === 'throttle_can') {
      throttle.push(value);
    }
  }

  return {
    maxSpeed: speeds.length > 0 ? max(speeds) : null,
    avgSpeed: speeds.length > 0 ? mean(speeds) : null,
    minSpeed: speeds.length > 0 ? min(speeds) : null,
    maxBrakeFront: brakeFront.length > 0 ? max(brakeFront) : null,
    maxBrakeRear: brakeRear.length > 0 ? max(brakeRear) : null,
    avgThrottle: throttle.length > 0 ? mean(throttle) : null,
    dataPoints: telemetry.length
  };
}

/**
 * Analyze section statistics for a vehicle
 * @param {Array<Object>} sections - Section analysis records
 * @returns {Object} Section statistics
 */
function analyzeSectionStatistics(sections) {
  if (!sections || sections.length === 0) {
    return {
      s1: { fastest: null, average: null, count: 0 },
      s2: { fastest: null, average: null, count: 0 },
      s3: { fastest: null, average: null, count: 0 },
      topSpeed: null
    };
  }

  // Collect section times
  const s1Times = [];
  const s2Times = [];
  const s3Times = [];
  const topSpeeds = [];

  for (const record of sections) {
    const s1Ms = parseTimeToMs(record.s1);
    const s2Ms = parseTimeToMs(record.s2);
    const s3Ms = parseTimeToMs(record.s3);

    if (s1Ms !== null) s1Times.push(s1Ms);
    if (s2Ms !== null) s2Times.push(s2Ms);
    if (s3Ms !== null) s3Times.push(s3Ms);

    if (record.top_speed && !isNaN(record.top_speed)) {
      topSpeeds.push(record.top_speed);
    }
  }

  return {
    s1: {
      fastest: s1Times.length > 0 ? min(s1Times) : null,
      average: s1Times.length > 0 ? mean(s1Times) : null,
      count: s1Times.length
    },
    s2: {
      fastest: s2Times.length > 0 ? min(s2Times) : null,
      average: s2Times.length > 0 ? mean(s2Times) : null,
      count: s2Times.length
    },
    s3: {
      fastest: s3Times.length > 0 ? min(s3Times) : null,
      average: s3Times.length > 0 ? mean(s3Times) : null,
      count: s3Times.length
    },
    topSpeed: topSpeeds.length > 0 ? max(topSpeeds) : null
  };
}

/**
 * Calculate overall statistics combining all data sources
 * @param {Object} analysis - Analysis object with all statistics
 * @returns {Object} Overall statistics
 */
function calculateOverallStatistics(analysis) {
  const { lapStatistics, raceStatistics, telemetryStatistics, sectionStatistics } = analysis;

  return {
    fastestLap: lapStatistics.fastestLap,
    averageLap: lapStatistics.averageLap,
    totalLaps: lapStatistics.totalLaps || raceStatistics.totalLaps,
    maxSpeed: telemetryStatistics.maxSpeed || sectionStatistics.topSpeed,
    position: raceStatistics.position,
    consistency: lapStatistics.consistency,
    dataQuality: {
      hasLapData: lapStatistics.totalLaps > 0,
      hasRaceResult: raceStatistics.position !== null,
      hasTelemetry: telemetryStatistics.dataPoints > 0,
      hasSectionData: sectionStatistics.s1.count > 0
    }
  };
}
