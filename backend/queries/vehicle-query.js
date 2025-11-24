/**
 * Vehicle Query Module
 * Provides functions to query and aggregate data for specific vehicles across all datasets
 */

/**
 * Resolve car number to vehicle ID using race results
 * @param {number} carNumber - The car number to resolve
 * @param {Array<Object>} results - Array of race result records
 * @returns {string|null} Vehicle ID or null if not found
 */
export function resolveVehicleId(carNumber, results) {
  if (!results || results.length === 0) {
    return null;
  }

  // Race results have car numbers but not vehicle IDs
  // We need to find the vehicle ID from other datasets
  // For now, return null as we need to cross-reference with other data
  const result = results.find(r => r.number === carNumber);
  return result ? null : null; // Will be resolved when we have lap time data
}

/**
 * Filter records by vehicle ID
 * @param {Array<Object>} records - Array of records with vehicle_id field
 * @param {string} vehicleId - The vehicle ID to filter by
 * @returns {Array<Object>} Filtered records matching the vehicle ID
 */
export function filterByVehicle(records, vehicleId) {
  if (!records || records.length === 0 || !vehicleId) {
    return [];
  }

  return records.filter(record => record.vehicle_id === vehicleId);
}

/**
 * Filter section records by car number
 * @param {Array<Object>} records - Array of section records with number field
 * @param {number} carNumber - The car number to filter by
 * @returns {Array<Object>} Filtered records matching the car number
 */
export function filterSectionsByCarNumber(records, carNumber) {
  if (!records || records.length === 0 || carNumber === null || carNumber === undefined) {
    return [];
  }

  return records.filter(record => record.number === carNumber);
}

/**
 * Query all data for a specific vehicle across all datasets
 * @param {string|number} vehicleIdentifier - Vehicle ID (string) or car number (number)
 * @param {Object} allData - Object containing all parsed datasets
 * @param {Array<Object>} allData.lapTimes - Lap time records
 * @param {Array<Object>} allData.results - Race result records
 * @param {Array<Object>} allData.telemetry - Telemetry records
 * @param {Array<Object>} allData.sections - Section analysis records
 * @returns {Promise<Object>} Aggregated vehicle data
 */
export async function queryVehicle(vehicleIdentifier, allData) {
  const { lapTimes = [], results = [], telemetry = [], sections = [] } = allData;

  // Determine if identifier is a car number or vehicle ID
  const isCarNumber = typeof vehicleIdentifier === 'number';
  
  let vehicleId = null;
  let carNumber = null;

  if (isCarNumber) {
    // Identifier is a car number, need to resolve to vehicle ID
    carNumber = vehicleIdentifier;
    
    // Find vehicle ID from lap times that matches this car number
    // We need to cross-reference: results have car numbers, lap times have vehicle IDs
    // First, find the result for this car number
    const result = results.find(r => r.number === carNumber);
    
    if (!result) {
      // Car number not found in results
      return createEmptyVehicleData(null, carNumber);
    }

    // Now we need to find the vehicle ID from lap times
    // Since we don't have a direct mapping, we'll need to use the car number from sections
    // which also have the number field
    const sectionForVehicle = sections.find(s => s.number === carNumber);
    
    if (sectionForVehicle) {
      // Try to find matching lap times - this is a heuristic approach
      // In real data, we'd need a proper mapping table
      // For now, we'll look for vehicle IDs that might contain the car number
      const possibleVehicleIds = new Set(lapTimes.map(lt => lt.vehicle_id));
      
      // Try to find a vehicle ID that contains the car number
      for (const vid of possibleVehicleIds) {
        // Check if this vehicle ID's lap count matches the result's lap count
        const vehicleLaps = lapTimes.filter(lt => lt.vehicle_id === vid);
        if (vehicleLaps.length === result.laps) {
          vehicleId = vid;
          break;
        }
      }
    }
    
    if (!vehicleId) {
      // Could not resolve vehicle ID, but we have car number data
      // Return data that's available by car number
      return {
        vehicleId: null,
        carNumber: carNumber,
        class: result.class,
        lapTimes: [],
        raceResult: result,
        telemetry: [],
        sections: filterSectionsByCarNumber(sections, carNumber),
        statistics: {
          fastestLap: null,
          averageLap: null,
          totalLaps: result.laps,
          maxSpeed: null,
          position: result.position
        }
      };
    }
  } else {
    // Identifier is a vehicle ID
    vehicleId = vehicleIdentifier;
    
    // Try to find car number from sections or results
    const vehicleLapTimes = filterByVehicle(lapTimes, vehicleId);
    
    if (vehicleLapTimes.length === 0) {
      // Vehicle ID not found
      return createEmptyVehicleData(vehicleId, null);
    }
    
    // Try to find car number by matching lap count
    const lapCount = vehicleLapTimes.length;
    const matchingResult = results.find(r => r.laps === lapCount);
    
    if (matchingResult) {
      carNumber = matchingResult.number;
    }
  }

  // Now filter all datasets by vehicle ID and car number
  const vehicleLapTimes = filterByVehicle(lapTimes, vehicleId);
  const vehicleTelemetry = filterByVehicle(telemetry, vehicleId);
  const vehicleSections = carNumber ? filterSectionsByCarNumber(sections, carNumber) : [];
  
  // Find race result by car number
  const raceResult = carNumber ? results.find(r => r.number === carNumber) : null;

  // Calculate statistics
  const statistics = calculateVehicleStatistics(
    vehicleLapTimes,
    vehicleTelemetry,
    raceResult
  );

  return {
    vehicleId,
    carNumber,
    class: raceResult?.class || null,
    lapTimes: vehicleLapTimes,
    raceResult: raceResult || null,
    telemetry: vehicleTelemetry,
    sections: vehicleSections,
    statistics
  };
}

/**
 * Create empty vehicle data structure
 * @param {string|null} vehicleId - Vehicle ID
 * @param {number|null} carNumber - Car number
 * @returns {Object} Empty vehicle data
 */
function createEmptyVehicleData(vehicleId, carNumber) {
  return {
    vehicleId,
    carNumber,
    class: null,
    lapTimes: [],
    raceResult: null,
    telemetry: [],
    sections: [],
    statistics: {
      fastestLap: null,
      averageLap: null,
      totalLaps: 0,
      maxSpeed: null,
      position: null
    }
  };
}

/**
 * Calculate statistics for a vehicle
 * @param {Array<Object>} lapTimes - Vehicle's lap time records
 * @param {Array<Object>} telemetry - Vehicle's telemetry records
 * @param {Object|null} raceResult - Vehicle's race result
 * @returns {Object} Calculated statistics
 */
function calculateVehicleStatistics(lapTimes, telemetry, raceResult) {
  const statistics = {
    fastestLap: null,
    averageLap: null,
    totalLaps: lapTimes.length,
    maxSpeed: null,
    position: raceResult?.position || null
  };

  // Calculate fastest and average lap
  if (lapTimes.length > 0) {
    const lapValues = lapTimes.map(lt => lt.value);
    statistics.fastestLap = Math.min(...lapValues);
    statistics.averageLap = lapValues.reduce((sum, val) => sum + val, 0) / lapValues.length;
  }

  // Calculate max speed from telemetry
  if (telemetry.length > 0) {
    const speeds = telemetry
      .filter(t => t.telemetry_name === 'vCar')
      .map(t => t.telemetry_value);
    
    if (speeds.length > 0) {
      statistics.maxSpeed = Math.max(...speeds);
    }
  }

  return statistics;
}
