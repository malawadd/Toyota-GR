import { parseLapTimes } from './parsers/lap-time-parser.js';
import { parseRaceResults } from './parsers/results-parser.js';
import { parseTelemetry } from './parsers/telemetry-parser.js';
import { parseSections } from './parsers/section-parser.js';
import { queryVehicle } from './queries/vehicle-query.js';
import { analyzeVehicleData } from './analyzers/vehicle-analyzer.js';
import { generateVehicleReport } from './reporters/vehicle-report.js';
import { formatLapTime, formatNumber } from './reporters/markdown-generator.js';

/**
 * Query and analyze data for a specific vehicle
 * @param {string|number} vehicleIdentifier - Vehicle ID (string) or car number (number)
 */
async function queryVehicleData(vehicleIdentifier) {
  try {
    console.log('🏎️  Vehicle Query');
    console.log('='.repeat(50));
    console.log(`Querying: ${typeof vehicleIdentifier === 'number' ? `Car #${vehicleIdentifier}` : vehicleIdentifier}`);
    console.log();

    // Load all race data files
    console.log('📂 Loading race data files...');
    
    const lapTimes = await parseLapTimes('COTA_lap_time_R1.csv');
    console.log(`✓ Loaded ${lapTimes.length} lap time records`);
    
    const results = await parseRaceResults('00_Results GR Cup Race 1 Official_Anonymized.CSV');
    console.log(`✓ Loaded ${results.length} race results`);
    
    const sections = await parseSections('23_AnalysisEnduranceWithSections_Race 1_Anonymized.CSV');
    console.log(`✓ Loaded ${sections.length} section records`);
    
    // For telemetry, we'll load it with streaming and filter by vehicle
    // First, we need to determine the vehicle ID
    let targetVehicleId = null;
    let targetCarNumber = null;
    
    if (typeof vehicleIdentifier === 'number') {
      targetCarNumber = vehicleIdentifier;
      // Find vehicle ID from lap times by matching lap count with results
      const result = results.find(r => r.number === targetCarNumber);
      if (result) {
        // Find matching vehicle ID by lap count
        const vehicleIds = [...new Set(lapTimes.map(lt => lt.vehicle_id))];
        for (const vid of vehicleIds) {
          const vehicleLaps = lapTimes.filter(lt => lt.vehicle_id === vid);
          if (vehicleLaps.length === result.laps) {
            targetVehicleId = vid;
            break;
          }
        }
      }
    } else {
      targetVehicleId = vehicleIdentifier;
    }
    
    // Stream telemetry and filter by vehicle ID
    const telemetry = [];
    if (targetVehicleId) {
      await parseTelemetry('R1_cota_telemetry_data.csv', (records) => {
        const filtered = records.filter(r => r.vehicle_id === targetVehicleId);
        telemetry.push(...filtered);
      });
      console.log(`✓ Loaded ${telemetry.length} telemetry records for vehicle`);
    } else {
      console.log(`⚠️  Skipping telemetry (vehicle ID not resolved yet)`);
    }
    console.log();

    // Query vehicle data
    console.log('🔍 Querying vehicle data...');
    const allData = { lapTimes, results, telemetry, sections };
    const vehicleData = await queryVehicle(vehicleIdentifier, allData);
    
    // Check if vehicle was found
    if (!vehicleData.vehicleId && !vehicleData.carNumber) {
      console.log('❌ Vehicle not found in any dataset');
      console.log();
      console.log('💡 Tips:');
      console.log('   - Check if the vehicle ID or car number is correct');
      console.log('   - Try using a different identifier (vehicle ID vs car number)');
      console.log('   - Verify the vehicle participated in this race');
      return;
    }
    
    if (vehicleData.lapTimes.length === 0 && 
        !vehicleData.raceResult && 
        vehicleData.telemetry.length === 0 && 
        vehicleData.sections.length === 0) {
      console.log('⚠️  Vehicle found but no data available');
      console.log(`   Vehicle ID: ${vehicleData.vehicleId || 'N/A'}`);
      console.log(`   Car Number: ${vehicleData.carNumber !== null ? `#${vehicleData.carNumber}` : 'N/A'}`);
      return;
    }
    
    console.log('✓ Vehicle data retrieved');
    console.log();

    // Analyze vehicle data
    console.log('📊 Analyzing vehicle data...');
    const analysis = analyzeVehicleData(vehicleData);
    console.log('✓ Analysis complete');
    console.log();

    // Generate report
    console.log('📝 Generating vehicle report...');
    const reportFilename = vehicleData.carNumber 
      ? `vehicle-${vehicleData.carNumber}-report.md`
      : `vehicle-${vehicleData.vehicleId}-report.md`;
    await generateVehicleReport(analysis, reportFilename);
    console.log(`✓ Report saved to ${reportFilename}`);
    console.log();

    // Print summary to console
    console.log('📈 Summary');
    console.log('-'.repeat(50));
    console.log(`Vehicle ID:      ${analysis.vehicleId || 'N/A'}`);
    console.log(`Car Number:      ${analysis.carNumber !== null && analysis.carNumber !== undefined ? `#${analysis.carNumber}` : 'N/A'}`);
    console.log(`Class:           ${analysis.class || 'N/A'}`);
    console.log();

    // Overall statistics
    if (analysis.overallStatistics) {
      const overall = analysis.overallStatistics;
      console.log('🏁 Performance');
      console.log('-'.repeat(50));
      console.log(`Position:        ${overall.position !== null ? overall.position : 'N/A'}`);
      console.log(`Total Laps:      ${overall.totalLaps || 0}`);
      console.log(`Fastest Lap:     ${overall.fastestLap !== null ? formatLapTime(overall.fastestLap) : 'N/A'}`);
      console.log(`Average Lap:     ${overall.averageLap !== null ? formatLapTime(overall.averageLap) : 'N/A'}`);
      console.log(`Max Speed:       ${overall.maxSpeed !== null ? formatNumber(overall.maxSpeed, 1) + ' km/h' : 'N/A'}`);
      console.log(`Consistency:     ${overall.consistency !== null ? formatNumber(overall.consistency * 100, 2) + '%' : 'N/A'}`);
      console.log();
    }

    // Data availability
    if (analysis.overallStatistics && analysis.overallStatistics.dataQuality) {
      const quality = analysis.overallStatistics.dataQuality;
      console.log('📊 Data Availability');
      console.log('-'.repeat(50));
      console.log(`Lap Data:        ${quality.hasLapData ? '✓' : '✗'}`);
      console.log(`Race Result:     ${quality.hasRaceResult ? '✓' : '✗'}`);
      console.log(`Telemetry:       ${quality.hasTelemetry ? '✓' : '✗'}`);
      console.log(`Section Data:    ${quality.hasSectionData ? '✓' : '✗'}`);
      console.log();
    }

    console.log('✅ Vehicle query complete!');
  } catch (error) {
    console.error('❌ Error during vehicle query:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Parse command-line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Error: No vehicle identifier provided');
  console.log();
  console.log('Usage:');
  console.log('  node query-vehicle.js <vehicle_id>');
  console.log('  node query-vehicle.js <car_number>');
  console.log();
  console.log('Examples:');
  console.log('  node query-vehicle.js GR86-004-78');
  console.log('  node query-vehicle.js 46');
  process.exit(1);
}

// Parse the identifier - if it's a number, treat as car number, otherwise as vehicle ID
const identifier = args[0];
const vehicleIdentifier = /^\d+$/.test(identifier) ? parseInt(identifier, 10) : identifier;

// Run the query
queryVehicleData(vehicleIdentifier);
