import { writeFile } from 'fs/promises';
import { createTable, createHeading, formatNumber } from './markdown-generator.js';

/**
 * Generate a markdown report for race results analysis
 * @param {Object} analysis - Analysis results from analyzeRaceResults
 * @param {Array<Object>} resultRecords - Original result records for detailed info
 * @param {string} outputPath - Path to write the markdown file
 * @returns {Promise<void>}
 */
export async function generateResultsReport(analysis, resultRecords, outputPath) {
  const lines = [];
  
  // Title
  lines.push(createHeading('Race Results Report', 1));
  lines.push('');
  
  // Race winner
  if (analysis.winner) {
    lines.push(createHeading('Race Winner', 2));
    lines.push('');
    lines.push(`🏆 **Winner: Car #${analysis.winner.number}** - ${analysis.winner.total_time}`);
    lines.push(`- Laps Completed: ${analysis.winner.laps}`);
    lines.push(`- Best Lap: ${analysis.winner.best_lap_time}`);
    lines.push(`- Class: ${analysis.winner.class}`);
    lines.push('');
  }
  
  // Overall statistics
  lines.push(createHeading('Overall Statistics', 2));
  lines.push('');
  lines.push(`- **Total Vehicles**: ${analysis.totalVehicles}`);
  lines.push('');
  
  // Results by class
  if (analysis.byClass && analysis.byClass.size > 0) {
    lines.push(createHeading('Results by Class', 2));
    lines.push('');
    
    for (const [className, vehicles] of analysis.byClass.entries()) {
      lines.push(createHeading(`Class: ${className}`, 3));
      lines.push('');
      
      const headers = ['Position', 'Car #', 'Laps', 'Total Time', 'Gap to First', 'Gap to Previous', 'Best Lap'];
      const rows = vehicles.map(result => [
        result.position.toString(),
        result.number.toString(),
        result.laps.toString(),
        result.total_time,
        result.gap_first || '-',
        result.gap_previous || '-',
        result.best_lap_time || '-'
      ]);
      
      lines.push(createTable(headers, rows));
      lines.push('');
    }
  }
  
  // Full results table
  if (resultRecords && resultRecords.length > 0) {
    lines.push(createHeading('Complete Results', 2));
    lines.push('');
    
    const headers = ['Position', 'Car #', 'Laps', 'Total Time', 'Gap to First', 'Gap to Previous', 'Best Lap', 'Class'];
    const rows = resultRecords
      .sort((a, b) => a.position - b.position)
      .map(result => [
        result.position.toString(),
        result.number.toString(),
        result.laps.toString(),
        result.total_time,
        result.gap_first || '-',
        result.gap_previous || '-',
        result.best_lap_time || '-',
        result.class || '-'
      ]);
    
    lines.push(createTable(headers, rows));
    lines.push('');
  }
  
  // Write to file
  const content = lines.join('\n');
  await writeFile(outputPath, content, 'utf-8');
}
