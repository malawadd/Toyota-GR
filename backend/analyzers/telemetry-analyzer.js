import { max, mean } from 'simple-statistics';

/**
 * Analyze telemetry data for vehicles
 * @param {Array<Object>} telemetryRecords - Array of telemetry records from parser
 * @param {string} vehicleId - Optional vehicle ID to filter analysis
 * @returns {Object} Analysis results with speed and brake pressure statistics
 */
export function analyzeTelemetry(telemetryRecords, vehicleId = null) {
  if (!telemetryRecords || telemetryRecords.length === 0) {
    return {
      maxSpeed: null,
      avgSpeed: null,
      maxBrakeFront: null,
      maxBrakeRear: null,
      byVehicle: new Map()
    };
  }

  // Filter by vehicle if specified
  const records = vehicleId 
    ? telemetryRecords.filter(r => r.vehicle_id === vehicleId)
    : telemetryRecords;

  if (records.length === 0) {
    return {
      maxSpeed: null,
      avgSpeed: null,
      maxBrakeFront: null,
      maxBrakeRear: null,
      byVehicle: new Map()
    };
  }

  // Group telemetry by vehicle and type
  const vehicleMap = new Map();

  for (const record of records) {
    const vid = record.vehicle_id;
    
    if (!vehicleMap.has(vid)) {
      vehicleMap.set(vid, {
        speed: [],
        brake_front: [],
        brake_rear: []
      });
    }

    const vehicleData = vehicleMap.get(vid);
    const telemetryName = record.telemetry_name;
    const telemetryValue = record.telemetry_value;

    // Categorize telemetry data
    if (telemetryName === 'speed_can' || telemetryName === 'speed') {
      vehicleData.speed.push(telemetryValue);
    } else if (telemetryName === 'brake_front' || telemetryName === 'brake_front_can') {
      vehicleData.brake_front.push(telemetryValue);
    } else if (telemetryName === 'brake_rear' || telemetryName === 'brake_rear_can') {
      vehicleData.brake_rear.push(telemetryValue);
    }
  }

  // Calculate statistics for each vehicle
  const byVehicle = new Map();
  
  for (const [vid, data] of vehicleMap.entries()) {
    const stats = {
      vehicle: vid,
      maxSpeed: data.speed.length > 0 ? max(data.speed) : null,
      avgSpeed: data.speed.length > 0 ? mean(data.speed) : null,
      maxBrakeFront: data.brake_front.length > 0 ? max(data.brake_front) : null,
      maxBrakeRear: data.brake_rear.length > 0 ? max(data.brake_rear) : null
    };
    
    byVehicle.set(vid, stats);
  }

  // Calculate overall statistics
  const allSpeeds = [];
  const allBrakeFront = [];
  const allBrakeRear = [];

  for (const data of vehicleMap.values()) {
    allSpeeds.push(...data.speed);
    allBrakeFront.push(...data.brake_front);
    allBrakeRear.push(...data.brake_rear);
  }

  return {
    maxSpeed: allSpeeds.length > 0 ? max(allSpeeds) : null,
    avgSpeed: allSpeeds.length > 0 ? mean(allSpeeds) : null,
    maxBrakeFront: allBrakeFront.length > 0 ? max(allBrakeFront) : null,
    maxBrakeRear: allBrakeRear.length > 0 ? max(allBrakeRear) : null,
    byVehicle
  };
}
