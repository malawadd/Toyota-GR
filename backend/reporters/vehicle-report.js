import { writeFile } from 'fs/promises';
import { createTable, createHeading, formatNumber, formatLapTime } from './markdown-generator.js';

/**
 * Generate a unified markdown report for a specific vehicle
 * @param {Object} vehicleAnalysis - Analysis results from analyzeVehicleData
 * @param {string} outputPath - Path to write the markdown file
 * @returns {Promise<void>}
 */
export async function generateVehicleReport(vehicleAnalysis, outputPath) {
  const lines = [];
  
  // Title
  lines.push(createHeading('Vehicle Performance Report', 1));
  lines.push('');
  
  // Overview section
  lines.push(createHeading('Overview', 2));
  lines.push('');
  lines.push(`- **Vehicle ID**: ${vehicleAnalysis.vehicleId || 'N/A'}`);
  lines.push(`- **Car Number**: ${vehicleAnalysis.carNumber !== null && vehicleAnalysis.carNumber !== undefined ? `#${vehicleAnalysis.carNumber}` : 'N/A'}`);
  lines.push(`- **Class**: ${vehicleAnalysis.class || 'N/A'}`);
  
  // Add overall statistics if available
  if (vehicleAnalysis.overallStatistics) {
    const overall = vehicleAnalysis.overallStatistics;
    lines.push('');
    lines.push(createHeading('Key Statistics', 3));
    lines.push('');
    lines.push(`- **Position**: ${overall.position !== null ? overall.position : 'N/A'}`);
    lines.push(`- **Total Laps**: ${overall.totalLaps || 0}`);
    lines.push(`- **Fastest Lap**: ${overall.fastestLap !== null ? formatLapTime(overall.fastestLap) : 'N/A'}`);
    lines.push(`- **Average Lap**: ${overall.averageLap !== null ? formatLapTime(overall.averageLap) : 'N/A'}`);
    lines.push(`- **Max Speed**: ${overall.maxSpeed !== null ? formatNumber(overall.maxSpeed, 1) + ' km/h' : 'N/A'}`);
    lines.push(`- **Consistency**: ${overall.consistency !== null ? formatNumber(overall.consistency * 100, 2) + '%' : 'N/A'}`);
  }
  lines.push('');
  
  // Lap Times section
  if (vehicleAnalysis.lapStatistics && vehicleAnalysis.lapStatistics.totalLaps > 0) {
    lines.push(createHeading('Lap Times', 2));
    lines.push('');
    
    const lapStats = vehicleAnalysis.lapStatistics;
    lines.push(`- **Total Laps**: ${lapStats.totalLaps}`);
    lines.push(`- **Fastest Lap**: ${lapStats.fastestLap !== null ? formatLapTime(lapStats.fastestLap) : 'N/A'}`);
    lines.push(`- **Average Lap**: ${lapStats.averageLap !== null ? formatLapTime(lapStats.averageLap) : 'N/A'}`);
    lines.push(`- **Slowest Lap**: ${lapStats.slowestLap !== null ? formatLapTime(lapStats.slowestLap) : 'N/A'}`);
    lines.push(`- **Standard Deviation**: ${lapStats.stdDev !== null ? formatNumber(lapStats.stdDev / 1000, 3) + 's' : 'N/A'}`);
    lines.push(`- **Consistency**: ${lapStats.consistency !== null ? formatNumber(lapStats.consistency * 100, 2) + '%' : 'N/A'}`);
    lines.push('');
  }
  
  // Race Results section
  if (vehicleAnalysis.raceStatistics && vehicleAnalysis.raceStatistics.position !== null) {
    lines.push(createHeading('Race Results', 2));
    lines.push('');
    
    const raceStats = vehicleAnalysis.raceStatistics;
    lines.push(`- **Final Position**: ${raceStats.position}`);
    lines.push(`- **Laps Completed**: ${raceStats.totalLaps}`);
    lines.push(`- **Total Time**: ${raceStats.totalTime || 'N/A'}`);
    lines.push(`- **Gap to First**: ${raceStats.gapToFirst || 'N/A'}`);
    lines.push(`- **Gap to Previous**: ${raceStats.gapToPrevious || 'N/A'}`);
    lines.push(`- **Best Lap Time**: ${raceStats.bestLapTime || 'N/A'}`);
    lines.push('');
  }
  
  // Telemetry section
  if (vehicleAnalysis.telemetryStatistics && vehicleAnalysis.telemetryStatistics.dataPoints > 0) {
    lines.push(createHeading('Telemetry', 2));
    lines.push('');
    
    const telStats = vehicleAnalysis.telemetryStatistics;
    lines.push(`- **Data Points**: ${telStats.dataPoints}`);
    lines.push(`- **Max Speed**: ${telStats.maxSpeed !== null ? formatNumber(telStats.maxSpeed, 1) + ' km/h' : 'N/A'}`);
    lines.push(`- **Average Speed**: ${telStats.avgSpeed !== null ? formatNumber(telStats.avgSpeed, 1) + ' km/h' : 'N/A'}`);
    lines.push(`- **Min Speed**: ${telStats.minSpeed !== null ? formatNumber(telStats.minSpeed, 1) + ' km/h' : 'N/A'}`);
    lines.push(`- **Max Brake Front**: ${telStats.maxBrakeFront !== null ? formatNumber(telStats.maxBrakeFront, 1) + ' bar' : 'N/A'}`);
    lines.push(`- **Max Brake Rear**: ${telStats.maxBrakeRear !== null ? formatNumber(telStats.maxBrakeRear, 1) + ' bar' : 'N/A'}`);
    lines.push(`- **Average Throttle**: ${telStats.avgThrottle !== null ? formatNumber(telStats.avgThrottle, 1) + '%' : 'N/A'}`);
    lines.push('');
  }
  
  // Section Analysis section
  if (vehicleAnalysis.sectionStatistics) {
    const secStats = vehicleAnalysis.sectionStatistics;
    const hasSectionData = secStats.s1.count > 0 || secStats.s2.count > 0 || secStats.s3.count > 0;
    
    if (hasSectionData) {
      lines.push(createHeading('Section Analysis', 2));
      lines.push('');
      
      const headers = ['Section', 'Fastest Time', 'Average Time', 'Laps'];
      const rows = [];
      
      if (secStats.s1.count > 0) {
        rows.push([
          'S1',
          secStats.s1.fastest !== null ? formatLapTime(secStats.s1.fastest) : 'N/A',
          secStats.s1.average !== null ? formatLapTime(secStats.s1.average) : 'N/A',
          secStats.s1.count.toString()
        ]);
      }
      
      if (secStats.s2.count > 0) {
        rows.push([
          'S2',
          secStats.s2.fastest !== null ? formatLapTime(secStats.s2.fastest) : 'N/A',
          secStats.s2.average !== null ? formatLapTime(secStats.s2.average) : 'N/A',
          secStats.s2.count.toString()
        ]);
      }
      
      if (secStats.s3.count > 0) {
        rows.push([
          'S3',
          secStats.s3.fastest !== null ? formatLapTime(secStats.s3.fastest) : 'N/A',
          secStats.s3.average !== null ? formatLapTime(secStats.s3.average) : 'N/A',
          secStats.s3.count.toString()
        ]);
      }
      
      if (rows.length > 0) {
        lines.push(createTable(headers, rows));
        lines.push('');
      }
      
      if (secStats.topSpeed !== null) {
        lines.push(`- **Top Speed**: ${formatNumber(secStats.topSpeed, 1)} km/h`);
        lines.push('');
      }
    }
  }
  
  // Write to file
  const content = lines.join('\n');
  await writeFile(outputPath, content, 'utf-8');
}
