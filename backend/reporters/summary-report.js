import { writeFile } from 'fs/promises';
import { createHeading, formatLapTime, formatNumber } from './markdown-generator.js';

/**
 * Generate a comprehensive summary report from all analyses
 * @param {Object} allAnalysis - Object containing all analysis results
 * @param {string} outputPath - Path to write the markdown file
 * @returns {Promise<void>}
 */
export async function generateSummaryReport(allAnalysis, outputPath) {
  const lines = [];
  
  // Title
  lines.push(createHeading('Race Data Summary Report', 1));
  lines.push('');
  lines.push('*Comprehensive analysis of race performance, telemetry, weather, and track sections*');
  lines.push('');
  lines.push('---');
  lines.push('');
  
  // Race Overview
  lines.push(createHeading('Race Overview', 2));
  lines.push('');
  
  if (allAnalysis.results) {
    lines.push(`- **Total Vehicles**: ${allAnalysis.results.totalVehicles || 'N/A'}`);
  }
  
  if (allAnalysis.laps) {
    const totalLaps = allAnalysis.laps.rankings 
      ? allAnalysis.laps.rankings.reduce((sum, r) => sum + r.lapCount, 0)
      : 'N/A';
    lines.push(`- **Total Laps Completed**: ${totalLaps}`);
  }
  
  if (allAnalysis.duration) {
    lines.push(`- **Race Duration**: ${formatLapTime(allAnalysis.duration)}`);
  }
  
  if (allAnalysis.laps && allAnalysis.laps.fastest) {
    lines.push(`- **Fastest Lap**: ${formatLapTime(allAnalysis.laps.fastest)}`);
  }
  
  lines.push('');
  
  // Winner Information
  if (allAnalysis.results && allAnalysis.results.winner) {
    lines.push(createHeading('Race Winner', 2));
    lines.push('');
    lines.push(`🏆 **Car #${allAnalysis.results.winner.number}**`);
    lines.push(`- Total Time: ${allAnalysis.results.winner.total_time}`);
    lines.push(`- Laps: ${allAnalysis.results.winner.laps}`);
    lines.push(`- Best Lap: ${allAnalysis.results.winner.best_lap_time}`);
    lines.push(`- Class: ${allAnalysis.results.winner.class}`);
    lines.push('');
  }
  
  // Lap Performance Summary
  if (allAnalysis.laps) {
    lines.push(createHeading('Lap Performance', 2));
    lines.push('');
    lines.push(`- **Fastest Lap**: ${formatLapTime(allAnalysis.laps.fastest)}`);
    lines.push(`- **Average Lap**: ${formatLapTime(allAnalysis.laps.average)}`);
    lines.push(`- **Lap Time Std Dev**: ${formatNumber(allAnalysis.laps.stdDev / 1000, 3)}s`);
    
    if (allAnalysis.laps.rankings && allAnalysis.laps.rankings.length > 0) {
      lines.push('');
      lines.push('**Top 3 Vehicles:**');
      allAnalysis.laps.rankings.slice(0, 3).forEach(r => {
        lines.push(`${r.rank}. Vehicle ${r.vehicle} - ${formatLapTime(r.fastest)}`);
      });
    }
    lines.push('');
  }
  
  // Telemetry Summary
  if (allAnalysis.telemetry) {
    lines.push(createHeading('Telemetry Highlights', 2));
    lines.push('');
    lines.push(`- **Maximum Speed**: ${formatNumber(allAnalysis.telemetry.maxSpeed, 2)} km/h`);
    lines.push(`- **Average Speed**: ${formatNumber(allAnalysis.telemetry.avgSpeed, 2)} km/h`);
    lines.push(`- **Max Front Brake**: ${formatNumber(allAnalysis.telemetry.maxBrakeFront, 2)} bar`);
    lines.push(`- **Max Rear Brake**: ${formatNumber(allAnalysis.telemetry.maxBrakeRear, 2)} bar`);
    lines.push('');
  }
  
  // Weather Summary
  if (allAnalysis.weather) {
    lines.push(createHeading('Weather Conditions', 2));
    lines.push('');
    lines.push(`- **Air Temperature**: ${formatNumber(allAnalysis.weather.avgAirTemp, 1)}°C (${formatNumber(allAnalysis.weather.minTemp, 1)}°C - ${formatNumber(allAnalysis.weather.maxTemp, 1)}°C)`);
    lines.push(`- **Track Temperature**: ${formatNumber(allAnalysis.weather.avgTrackTemp, 1)}°C`);
    lines.push(`- **Humidity**: ${formatNumber(allAnalysis.weather.avgHumidity, 1)}%`);
    lines.push(`- **Wind Speed**: ${formatNumber(allAnalysis.weather.avgWindSpeed, 1)} km/h (${formatNumber(allAnalysis.weather.minWindSpeed, 1)} - ${formatNumber(allAnalysis.weather.maxWindSpeed, 1)} km/h)`);
    
    if (allAnalysis.weather.rainPeriods && allAnalysis.weather.rainPeriods.length > 0) {
      lines.push(`- **Rain Periods**: ${allAnalysis.weather.rainPeriods.length}`);
    } else {
      lines.push(`- **Rain**: No rain detected`);
    }
    lines.push('');
  }
  
  // Section Performance Summary
  if (allAnalysis.sections) {
    lines.push(createHeading('Track Section Performance', 2));
    lines.push('');
    
    for (const section of ['S1', 'S2', 'S3']) {
      const fastest = allAnalysis.sections.fastestBySection?.get(section);
      const avg = allAnalysis.sections.avgBySection?.get(section);
      const vehicle = allAnalysis.sections.fastestVehicleBySection?.get(section);
      
      if (fastest && avg && vehicle) {
        lines.push(`**${section}**: ${formatLapTime(fastest)} (Vehicle #${vehicle.vehicle}) | Avg: ${formatLapTime(avg)}`);
      }
    }
    lines.push('');
  }
  
  // Footer
  lines.push('---');
  lines.push('');
  lines.push(`*Report generated: ${new Date().toISOString()}*`);
  lines.push('');
  
  // Write to file
  const content = lines.join('\n');
  await writeFile(outputPath, content, 'utf-8');
}
