import { min, mean } from 'simple-statistics';

/**
 * Parse time string to milliseconds
 * @param {string} timeStr - Time string in format "M:SS.mmm" or "MM:SS.mmm"
 * @returns {number} Time in milliseconds
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
 * Analyze section performance data
 * @param {Array<Object>} sectionRecords - Array of section records from parser
 * @returns {Object} Analysis results with fastest and average times per section
 */
export function analyzeSections(sectionRecords) {
  if (!sectionRecords || sectionRecords.length === 0) {
    return {
      fastestBySection: new Map(),
      avgBySection: new Map(),
      fastestVehicleBySection: new Map()
    };
  }

  // Group section times by vehicle and section
  const vehicleMap = new Map();
  
  for (const record of sectionRecords) {
    const vehicleId = record.number;
    
    if (!vehicleMap.has(vehicleId)) {
      vehicleMap.set(vehicleId, {
        s1: [],
        s2: [],
        s3: []
      });
    }
    
    const vehicleData = vehicleMap.get(vehicleId);
    
    // Parse section times to milliseconds
    const s1Ms = parseTimeToMs(record.s1);
    const s2Ms = parseTimeToMs(record.s2);
    const s3Ms = parseTimeToMs(record.s3);
    
    if (s1Ms !== null) vehicleData.s1.push(s1Ms);
    if (s2Ms !== null) vehicleData.s2.push(s2Ms);
    if (s3Ms !== null) vehicleData.s3.push(s3Ms);
  }

  // Calculate fastest time per section across all vehicles
  const allS1 = [];
  const allS2 = [];
  const allS3 = [];
  
  for (const data of vehicleMap.values()) {
    allS1.push(...data.s1);
    allS2.push(...data.s2);
    allS3.push(...data.s3);
  }

  const fastestBySection = new Map();
  fastestBySection.set('S1', allS1.length > 0 ? min(allS1) : null);
  fastestBySection.set('S2', allS2.length > 0 ? min(allS2) : null);
  fastestBySection.set('S3', allS3.length > 0 ? min(allS3) : null);

  // Calculate average time per section across all vehicles
  const avgBySection = new Map();
  avgBySection.set('S1', allS1.length > 0 ? mean(allS1) : null);
  avgBySection.set('S2', allS2.length > 0 ? mean(allS2) : null);
  avgBySection.set('S3', allS3.length > 0 ? mean(allS3) : null);

  // Identify fastest vehicle per section
  const fastestVehicleBySection = new Map();
  
  // For each section, find the vehicle with the fastest time
  for (const section of ['S1', 'S2', 'S3']) {
    let fastestVehicle = null;
    let fastestTime = Infinity;
    
    for (const [vehicleId, data] of vehicleMap.entries()) {
      const sectionKey = section.toLowerCase();
      const times = data[sectionKey];
      
      if (times.length > 0) {
        const vehicleFastest = min(times);
        if (vehicleFastest < fastestTime) {
          fastestTime = vehicleFastest;
          fastestVehicle = vehicleId;
        }
      }
    }
    
    fastestVehicleBySection.set(section, {
      vehicle: fastestVehicle,
      time: fastestTime !== Infinity ? fastestTime : null
    });
  }

  return {
    fastestBySection,
    avgBySection,
    fastestVehicleBySection
  };
}
