import { writeFile } from 'fs/promises';
import { createTable, createHeading, formatNumber } from './markdown-generator.js';

/**
 * Generate a markdown report for telemetry analysis
 * @param {Object} analysis - Analysis results from analyzeTelemetry
 * @param {string} outputPath - Path to write the markdown file
 * @returns {Promise<void>}
 */
export async function generateTelemetryReport(analysis, outputPath) {
  const lines = [];
  
  // Title
  lines.push(createHeading('Telemetry Analysis Report', 1));
  lines.push('');
  
  // Overall statistics
  lines.push(createHeading('Overall Statistics', 2));
  lines.push('');
  lines.push(`- **Maximum Speed**: ${formatNumber(analysis.maxSpeed, 2)} km/h`);
  lines.push(`- **Average Speed**: ${formatNumber(analysis.avgSpeed, 2)} km/h`);
  lines.push(`- **Maximum Front Brake Pressure**: ${formatNumber(analysis.maxBrakeFront, 2)} bar`);
  lines.push(`- **Maximum Rear Brake Pressure**: ${formatNumber(analysis.maxBrakeRear, 2)} bar`);
  lines.push('');
  
  // Per-vehicle statistics
  if (analysis.byVehicle && analysis.byVehicle.size > 0) {
    lines.push(createHeading('Vehicle Statistics', 2));
    lines.push('');
    
    const headers = ['Vehicle', 'Max Speed (km/h)', 'Avg Speed (km/h)', 'Max Brake Front (bar)', 'Max Brake Rear (bar)'];
    const rows = Array.from(analysis.byVehicle.entries()).map(([vehicleId, stats]) => [
      vehicleId,
      formatNumber(stats.maxSpeed, 2),
      formatNumber(stats.avgSpeed, 2),
      formatNumber(stats.maxBrakeFront, 2),
      formatNumber(stats.maxBrakeRear, 2)
    ]);
    
    lines.push(createTable(headers, rows));
    lines.push('');
  }
  
  // Write to file
  const content = lines.join('\n');
  await writeFile(outputPath, content, 'utf-8');
}
