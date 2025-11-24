import { writeFile } from 'fs/promises';
import { createTable, createHeading, formatNumber } from './markdown-generator.js';

/**
 * Generate a markdown report for weather analysis
 * @param {Object} analysis - Analysis results from analyzeWeather
 * @param {string} outputPath - Path to write the markdown file
 * @returns {Promise<void>}
 */
export async function generateWeatherReport(analysis, outputPath) {
  const lines = [];
  
  // Title
  lines.push(createHeading('Weather Analysis Report', 1));
  lines.push('');
  
  // Average conditions
  lines.push(createHeading('Average Conditions', 2));
  lines.push('');
  lines.push(`- **Air Temperature**: ${formatNumber(analysis.avgAirTemp, 2)}°C`);
  lines.push(`- **Track Temperature**: ${formatNumber(analysis.avgTrackTemp, 2)}°C`);
  lines.push(`- **Humidity**: ${formatNumber(analysis.avgHumidity, 2)}%`);
  lines.push(`- **Pressure**: ${formatNumber(analysis.avgPressure, 2)} hPa`);
  lines.push(`- **Wind Speed**: ${formatNumber(analysis.avgWindSpeed, 2)} km/h`);
  lines.push('');
  
  // Temperature range
  lines.push(createHeading('Temperature Range', 2));
  lines.push('');
  lines.push(`- **Minimum**: ${formatNumber(analysis.minTemp, 2)}°C`);
  lines.push(`- **Maximum**: ${formatNumber(analysis.maxTemp, 2)}°C`);
  lines.push(`- **Range**: ${formatNumber(analysis.maxTemp - analysis.minTemp, 2)}°C`);
  lines.push('');
  
  // Wind speed range
  lines.push(createHeading('Wind Speed Range', 2));
  lines.push('');
  lines.push(`- **Minimum**: ${formatNumber(analysis.minWindSpeed, 2)} km/h`);
  lines.push(`- **Maximum**: ${formatNumber(analysis.maxWindSpeed, 2)} km/h`);
  lines.push(`- **Range**: ${formatNumber(analysis.maxWindSpeed - analysis.minWindSpeed, 2)} km/h`);
  lines.push('');
  
  // Rain periods
  lines.push(createHeading('Rain Periods', 2));
  lines.push('');
  
  if (analysis.rainPeriods && analysis.rainPeriods.length > 0) {
    lines.push(`**Total Rain Periods**: ${analysis.rainPeriods.length}`);
    lines.push('');
    
    const headers = ['Timestamp', 'Rain (mm)', 'Air Temp (°C)', 'Track Temp (°C)'];
    const rows = analysis.rainPeriods.map(period => [
      period.timestamp.toISOString(),
      formatNumber(period.rain, 2),
      formatNumber(period.air_temp, 2),
      formatNumber(period.track_temp, 2)
    ]);
    
    lines.push(createTable(headers, rows));
    lines.push('');
  } else {
    lines.push('No rain detected during the session.');
    lines.push('');
  }
  
  // Write to file
  const content = lines.join('\n');
  await writeFile(outputPath, content, 'utf-8');
}
