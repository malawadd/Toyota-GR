import { writeFile } from 'fs/promises';
import { createTable, createHeading, formatNumber, formatLapTime } from './markdown-generator.js';

/**
 * Generate a markdown report for lap time analysis
 * @param {Object} analysis - Analysis results from analyzeLapTimes
 * @param {string} outputPath - Path to write the markdown file
 * @returns {Promise<void>}
 */
export async function generateLapReport(analysis, outputPath) {
  const lines = [];
  
  // Title
  lines.push(createHeading('Lap Time Analysis Report', 1));
  lines.push('');
  
  // Overall statistics
  lines.push(createHeading('Overall Statistics', 2));
  lines.push('');
  lines.push(`- **Fastest Lap**: ${formatLapTime(analysis.fastest)}`);
  lines.push(`- **Average Lap**: ${formatLapTime(analysis.average)}`);
  lines.push(`- **Standard Deviation**: ${formatNumber(analysis.stdDev / 1000, 3)}s`);
  lines.push('');
  
  // Rankings table
  if (analysis.rankings && analysis.rankings.length > 0) {
    lines.push(createHeading('Vehicle Rankings', 2));
    lines.push('');
    
    const headers = ['Rank', 'Vehicle', 'Fastest Lap', 'Average Lap', 'Std Dev', 'Lap Count', 'Consistency'];
    const rows = analysis.rankings.map(stats => [
      stats.rank.toString(),
      stats.vehicle,
      formatLapTime(stats.fastest),
      formatLapTime(stats.average),
      formatNumber(stats.stdDev / 1000, 3) + 's',
      stats.lapCount.toString(),
      formatNumber(stats.consistency * 100, 2) + '%'
    ]);
    
    lines.push(createTable(headers, rows));
    lines.push('');
  }
  
  // Write to file
  const content = lines.join('\n');
  await writeFile(outputPath, content, 'utf-8');
}
