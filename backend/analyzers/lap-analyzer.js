import { min, mean, standardDeviation } from 'simple-statistics';

/**
 * Analyze lap time data for all vehicles
 * @param {Array<Object>} lapRecords - Array of lap time records from parser
 * @returns {Object} Analysis results with fastest, average, stdDev, and rankings
 */
export function analyzeLapTimes(lapRecords) {
  if (!lapRecords || lapRecords.length === 0) {
    return {
      fastest: null,
      average: null,
      stdDev: null,
      byVehicle: new Map(),
      rankings: []
    };
  }

  // Group lap times by vehicle
  const vehicleMap = new Map();
  
  for (const record of lapRecords) {
    const vehicleId = record.vehicle_id;
    
    if (!vehicleMap.has(vehicleId)) {
      vehicleMap.set(vehicleId, []);
    }
    
    vehicleMap.get(vehicleId).push(record.value);
  }

  // Calculate statistics for each vehicle
  const byVehicle = new Map();
  
  for (const [vehicleId, lapTimes] of vehicleMap.entries()) {
    if (lapTimes.length === 0) continue;
    
    const fastest = min(lapTimes);
    const average = mean(lapTimes);
    const stdDev = lapTimes.length > 1 ? standardDeviation(lapTimes) : 0;
    const consistency = average > 0 ? stdDev / average : 0;
    
    byVehicle.set(vehicleId, {
      vehicle: vehicleId,
      fastest,
      average,
      stdDev,
      lapCount: lapTimes.length,
      consistency
    });
  }

  // Rank vehicles by fastest lap
  const rankings = Array.from(byVehicle.values())
    .sort((a, b) => a.fastest - b.fastest)
    .map((stats, index) => ({
      rank: index + 1,
      ...stats
    }));

  // Calculate overall statistics
  const allLapTimes = lapRecords.map(r => r.value);
  const fastest = min(allLapTimes);
  const average = mean(allLapTimes);
  const stdDev = allLapTimes.length > 1 ? standardDeviation(allLapTimes) : 0;

  return {
    fastest,
    average,
    stdDev,
    byVehicle,
    rankings
  };
}
