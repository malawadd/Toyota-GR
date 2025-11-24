import { parseTelemetry } from './parsers/telemetry-parser.js';
import { analyzeTelemetry } from './analyzers/telemetry-analyzer.js';
import { generateTelemetryReport } from './reporters/telemetry-report.js';
import { formatNumber } from './reporters/markdown-generator.js';

/**
 * Explore telemetry data
 * Loads telemetry data (with streaming for large files), analyzes it, generates a report, and prints summary
 */
async function exploreTelemetry() {
  try {
    console.log('🏁 Telemetry Analysis');
    console.log('='.repeat(50));
    console.log();

    // Load telemetry data (automatically uses streaming for large files)
    console.log('📂 Loading telemetry data...');
    console.log('   (Using streaming for large files > 50MB)');
    
    const telemetryData = await parseTelemetry('R1_cota_telemetry_data.csv');
    
    if (Array.isArray(telemetryData)) {
      console.log(`✓ Loaded ${telemetryData.length} telemetry records`);
    } else {
      console.log(`✓ Processed ${telemetryData.recordCount} telemetry records (streaming mode)`);
    }
    console.log();

    // Run analysis
    console.log('📊 Analyzing telemetry data...');
    const analysis = analyzeTelemetry(telemetryData);
    console.log(`✓ Analyzed ${analysis.byVehicle.size} vehicles`);
    console.log();

    // Generate report
    console.log('📝 Generating telemetry report...');
    await generateTelemetryReport(analysis, 'telemetry-analysis-report.md');
    console.log('✓ Report saved to telemetry-analysis-report.md');
    console.log();

    // Print summary to console
    console.log('📈 Summary');
    console.log('-'.repeat(50));
    console.log(`Max Speed:       ${formatNumber(analysis.maxSpeed, 2)} km/h`);
    console.log(`Avg Speed:       ${formatNumber(analysis.avgSpeed, 2)} km/h`);
    console.log(`Max Brake Front: ${formatNumber(analysis.maxBrakeFront, 2)} bar`);
    console.log(`Max Brake Rear:  ${formatNumber(analysis.maxBrakeRear, 2)} bar`);
    console.log(`Total Vehicles:  ${analysis.byVehicle.size}`);
    console.log();

    // Top 5 fastest vehicles
    console.log('🏆 Top 5 Fastest Vehicles');
    console.log('-'.repeat(50));
    const vehicleStats = Array.from(analysis.byVehicle.entries())
      .map(([vehicleId, stats]) => ({ vehicleId, ...stats }))
      .sort((a, b) => (b.maxSpeed || 0) - (a.maxSpeed || 0))
      .slice(0, 5);
    
    vehicleStats.forEach((stats, index) => {
      console.log(`${index + 1}. ${stats.vehicleId.padEnd(15)} - ${formatNumber(stats.maxSpeed, 2)} km/h (avg: ${formatNumber(stats.avgSpeed, 2)} km/h)`);
    });
    console.log();

    console.log('✅ Telemetry exploration complete!');
  } catch (error) {
    console.error('❌ Error during telemetry exploration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the exploration
exploreTelemetry();
