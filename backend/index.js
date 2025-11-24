import { readdirSync } from 'fs';
import { join } from 'path';
import { setupErrorHandlers } from './utils/error-handler.js';
import { parseLapTimes } from './parsers/lap-time-parser.js';
import { parseResults } from './parsers/results-parser.js';
import { parseTelemetry } from './parsers/telemetry-parser.js';
import { parseWeather } from './parsers/weather-parser.js';
import { parseSections } from './parsers/section-parser.js';
import { analyzeLapTimes } from './analyzers/lap-analyzer.js';
import { analyzeRaceResults } from './analyzers/results-analyzer.js';
import { analyzeTelemetry } from './analyzers/telemetry-analyzer.js';
import { analyzeWeather } from './analyzers/weather-analyzer.js';
import { analyzeSections } from './analyzers/section-analyzer.js';
import { generateLapReport } from './reporters/lap-report.js';
import { generateResultsReport } from './reporters/results-report.js';
import { generateTelemetryReport } from './reporters/telemetry-report.js';
import { generateWeatherReport } from './reporters/weather-report.js';
import { generateSectionReport } from './reporters/section-report.js';
import { generateSummaryReport } from './reporters/summary-report.js';

/**
 * Main function to explore race data
 * @param {string} dataDirectory - Directory containing CSV files
 * @param {string} outputDirectory - Directory to write reports
 * @returns {Promise<void>}
 */
export async function exploreRaceData(dataDirectory = '.', outputDirectory = './reports') {
  console.log('[Main] Starting race data exploration...');
  console.log(`[Main] Data directory: ${dataDirectory}`);
  console.log(`[Main] Output directory: ${outputDirectory}`);
  
  try {
    // Discover CSV files
    console.log('[Main] Discovering CSV files...');
    const files = readdirSync(dataDirectory).filter(f => f.endsWith('.csv') || f.endsWith('.CSV'));
    console.log(`[Main] Found ${files.length} CSV files`);
    
    const allAnalysis = {};
    
    // Parse and analyze lap times
    const lapTimeFiles = files.filter(f => f.includes('lap_time') || f.includes('Lap'));
    if (lapTimeFiles.length > 0) {
      console.log(`[Main] Processing lap time files: ${lapTimeFiles.join(', ')}`);
      const lapRecords = await parseLapTimes(join(dataDirectory, lapTimeFiles[0]));
      allAnalysis.laps = analyzeLapTimes(lapRecords);
      await generateLapReport(allAnalysis.laps, join(outputDirectory, 'lap-analysis.md'));
      console.log('[Main] Lap analysis complete');
    }
    
    // Parse and analyze race results
    const resultsFiles = files.filter(f => f.includes('Results') || f.includes('results'));
    if (resultsFiles.length > 0) {
      console.log(`[Main] Processing results files: ${resultsFiles.join(', ')}`);
      const resultRecords = await parseResults(join(dataDirectory, resultsFiles[0]));
      allAnalysis.results = analyzeRaceResults(resultRecords);
      await generateResultsReport(allAnalysis.results, resultRecords, join(outputDirectory, 'race-results.md'));
      console.log('[Main] Results analysis complete');
    }
    
    // Parse and analyze telemetry
    const telemetryFiles = files.filter(f => f.includes('telemetry') || f.includes('Telemetry'));
    if (telemetryFiles.length > 0) {
      console.log(`[Main] Processing telemetry files: ${telemetryFiles.join(', ')}`);
      const telemetryRecords = await parseTelemetry(join(dataDirectory, telemetryFiles[0]));
      allAnalysis.telemetry = analyzeTelemetry(telemetryRecords);
      await generateTelemetryReport(allAnalysis.telemetry, join(outputDirectory, 'telemetry-analysis.md'));
      console.log('[Main] Telemetry analysis complete');
    }
    
    // Parse and analyze weather
    const weatherFiles = files.filter(f => f.includes('Weather') || f.includes('weather'));
    if (weatherFiles.length > 0) {
      console.log(`[Main] Processing weather files: ${weatherFiles.join(', ')}`);
      const weatherRecords = await parseWeather(join(dataDirectory, weatherFiles[0]));
      allAnalysis.weather = analyzeWeather(weatherRecords);
      await generateWeatherReport(allAnalysis.weather, join(outputDirectory, 'weather-analysis.md'));
      console.log('[Main] Weather analysis complete');
    }
    
    // Parse and analyze sections
    const sectionFiles = files.filter(f => f.includes('Section') || f.includes('section') || f.includes('Endurance'));
    if (sectionFiles.length > 0) {
      console.log(`[Main] Processing section files: ${sectionFiles.join(', ')}`);
      const sectionRecords = await parseSections(join(dataDirectory, sectionFiles[0]));
      allAnalysis.sections = analyzeSections(sectionRecords);
      await generateSectionReport(allAnalysis.sections, join(outputDirectory, 'section-analysis.md'));
      console.log('[Main] Section analysis complete');
    }
    
    // Generate summary report
    console.log('[Main] Generating summary report...');
    await generateSummaryReport(allAnalysis, join(outputDirectory, 'summary.md'));
    
    console.log('[Main] Race data exploration complete!');
    console.log(`[Main] Reports written to: ${outputDirectory}`);
    
  } catch (error) {
    console.error('[Main] Error during race data exploration:');
    console.error(error.stack || error.message);
    throw error;
  }
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupErrorHandlers();
  
  const dataDir = process.argv[2] || '.';
  const outputDir = process.argv[3] || './reports';
  
  exploreRaceData(dataDir, outputDir)
    .then(() => {
      console.log('[Main] Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Main] Fatal error:', error.message);
      process.exit(1);
    });
}
