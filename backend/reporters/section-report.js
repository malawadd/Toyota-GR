import { writeFile } from 'fs/promises';
import { createTable, createHeading, formatLapTime } from './markdown-generator.js';

/**
 * Generate a markdown report for section analysis
 * @param {Object} analysis - Analysis results from analyzeSections
 * @param {string} outputPath - Path to write the markdown file
 * @returns {Promise<void>}
 */
export async function generateSectionReport(analysis, outputPath) {
  const lines = [];
  
  // Title
  lines.push(createHeading('Section Analysis Report', 1));
  lines.push('');
  
  // Fastest times per section
  lines.push(createHeading('Fastest Times by Section', 2));
  lines.push('');
  
  if (analysis.fastestBySection && analysis.fastestBySection.size > 0) {
    const headers = ['Section', 'Fastest Time', 'Fastest Vehicle'];
    const rows = [];
    
    for (const section of ['S1', 'S2', 'S3']) {
      const fastestTime = analysis.fastestBySection.get(section);
      const fastestVehicle = analysis.fastestVehicleBySection.get(section);
      
      rows.push([
        section,
        formatLapTime(fastestTime),
        fastestVehicle ? `#${fastestVehicle.vehicle}` : 'N/A'
      ]);
    }
    
    lines.push(createTable(headers, rows));
    lines.push('');
  }
  
  // Average times per section
  lines.push(createHeading('Average Times by Section', 2));
  lines.push('');
  
  if (analysis.avgBySection && analysis.avgBySection.size > 0) {
    const headers = ['Section', 'Average Time'];
    const rows = [];
    
    for (const section of ['S1', 'S2', 'S3']) {
      const avgTime = analysis.avgBySection.get(section);
      rows.push([
        section,
        formatLapTime(avgTime)
      ]);
    }
    
    lines.push(createTable(headers, rows));
    lines.push('');
  }
  
  // Section performance summary
  lines.push(createHeading('Section Performance Summary', 2));
  lines.push('');
  
  for (const section of ['S1', 'S2', 'S3']) {
    const fastestTime = analysis.fastestBySection.get(section);
    const avgTime = analysis.avgBySection.get(section);
    const fastestVehicle = analysis.fastestVehicleBySection.get(section);
    
    if (fastestTime && avgTime && fastestVehicle) {
      const delta = avgTime - fastestTime;
      lines.push(`**${section}**`);
      lines.push(`- Fastest: ${formatLapTime(fastestTime)} (Vehicle #${fastestVehicle.vehicle})`);
      lines.push(`- Average: ${formatLapTime(avgTime)}`);
      lines.push(`- Delta: ${formatLapTime(delta)}`);
      lines.push('');
    }
  }
  
  // Write to file
  const content = lines.join('\n');
  await writeFile(outputPath, content, 'utf-8');
}
