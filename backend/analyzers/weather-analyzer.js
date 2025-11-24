import { mean, min, max } from 'simple-statistics';

/**
 * Analyze weather data
 * @param {Array<Object>} weatherRecords - Array of weather records from parser
 * @returns {Object} Analysis results with averages, min/max, and rain periods
 */
export function analyzeWeather(weatherRecords) {
  if (!weatherRecords || weatherRecords.length === 0) {
    return {
      avgAirTemp: null,
      avgTrackTemp: null,
      avgHumidity: null,
      avgPressure: null,
      avgWindSpeed: null,
      minTemp: null,
      maxTemp: null,
      minWindSpeed: null,
      maxWindSpeed: null,
      rainPeriods: []
    };
  }

  // Extract all values for calculations
  const airTemps = weatherRecords.map(r => r.air_temp).filter(v => !isNaN(v));
  const trackTemps = weatherRecords.map(r => r.track_temp).filter(v => !isNaN(v));
  const humidities = weatherRecords.map(r => r.humidity).filter(v => !isNaN(v));
  const pressures = weatherRecords.map(r => r.pressure).filter(v => !isNaN(v));
  const windSpeeds = weatherRecords.map(r => r.wind_speed).filter(v => !isNaN(v));

  // Calculate averages for all weather metrics
  const avgAirTemp = airTemps.length > 0 ? mean(airTemps) : null;
  const avgTrackTemp = trackTemps.length > 0 ? mean(trackTemps) : null;
  const avgHumidity = humidities.length > 0 ? mean(humidities) : null;
  const avgPressure = pressures.length > 0 ? mean(pressures) : null;
  const avgWindSpeed = windSpeeds.length > 0 ? mean(windSpeeds) : null;

  // Identify min/max temperature (using air temperature)
  const minTemp = airTemps.length > 0 ? min(airTemps) : null;
  const maxTemp = airTemps.length > 0 ? max(airTemps) : null;

  // Identify min/max wind speed
  const minWindSpeed = windSpeeds.length > 0 ? min(windSpeeds) : null;
  const maxWindSpeed = windSpeeds.length > 0 ? max(windSpeeds) : null;

  // Flag rain periods (rain > 0)
  const rainPeriods = weatherRecords
    .filter(r => r.rain > 0)
    .map(r => ({
      timestamp: r.timestamp,
      rain: r.rain,
      air_temp: r.air_temp,
      track_temp: r.track_temp
    }));

  return {
    avgAirTemp,
    avgTrackTemp,
    avgHumidity,
    avgPressure,
    avgWindSpeed,
    minTemp,
    maxTemp,
    minWindSpeed,
    maxWindSpeed,
    rainPeriods
  };
}
