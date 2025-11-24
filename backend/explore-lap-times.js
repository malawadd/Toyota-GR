import { parseLapTimes } from './parsers/lap-time-parser.js';
import { analyzeLapTimes } from './analyzers/lap-analyzer.js';
import { generateLapReport } from './reporters/lap-report.js';
import { formatLapTime, formatNumber } from './reporters/markdown-generator.js';

/**
 * Explore lap time data
 * Loads lap timing data, analyzes it, generates a report, and prints summary
 */
async function exploreLapTimes() {
  try {
    console.log('🏁 Lap Time Analysis');
    console.log('='.repeat(50));
    console.log();

    // Load lap time data
    console.log('📂 Loading lap time data...');
    const lapData = await parseLapTimes('COTA_lap_time_R1.csv');
    console.log(`✓ Loaded ${lapData.length} lap records`);
    console.log();

    // Run analysis
    console.log('📊 Analyzing lap times...');
    const analysis = analyzeLapTimes(lapData);
    console.log(`✓ Analyzed ${analysis.rankings.length} vehicles`);
    console.log();

    // Generate report
    console.log('📝 Generating lap report...');
    await generateLapReport(analysis, 'lap-analysis-report.md');
    console.log('✓ Report saved to lap-analysis-report.md');
    console.log();

    // Print summary to console
    console.log('📈 Summary');
    console.log('-'.repeat(50));
    console.log(`Fastest Lap:     ${formatLapTime(analysis.fastest)}`);
    console.log(`Average Lap:     ${formatLapTime(analysis.average)}`);
    console.log(`Std Deviation:   ${formatNumber(analysis.stdDev / 1000, 3)}s`);
    console.log(`Total Vehicles:  ${analysis.rankings.length}`);
    console.log();

    // Top 5 vehicles
    console.log('🏆 Top 5 Fastest Vehicles');
    console.log('-'.repeat(50));
    const top5 = analysis.rankings.slice(0, 5);
    top5.forEach(stats => {
      console.log(`${stats.rank}. ${stats.vehicle.padEnd(15)} - ${formatLapTime(stats.fastest)} (avg: ${formatLapTime(stats.average)})`);
    });
    console.log();

    console.log('✅ Lap time exploration complete!');
  } catch (error) {
    console.error('❌ Error during lap time exploration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the exploration
exploreLapTimes();
