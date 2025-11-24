import { parseLapTimes } from './parsers/lap-time-parser.js';
import { parseRaceResults } from './parsers/results-parser.js';
import { parseCSVStream } from './parsers/base-parser.js';
import { parseWeather } from './parsers/weather-parser.js';
import { parseSections } from './parsers/section-parser.js';

import { analyzeLapTimes } from './analyzers/lap-analyzer.js';
import { analyzeRaceResults } from './analyzers/results-analyzer.js';
import { analyzeWeather } from './analyzers/weather-analyzer.js';
import { analyzeSections } from './analyzers/section-analyzer.js';

import { generateLapReport } from './reporters/lap-report.js';
import { generateResultsReport } from './reporters/results-report.js';
import { generateTelemetryReport } from './reporters/telemetry-report.js';
import { generateWeatherReport } from './reporters/weather-report.js';
import { generateSectionReport } from './reporters/section-report.js';
import { generateSummaryReport } from './reporters/summary-report.js';

import { formatLapTime, formatNumber } from './reporters/markdown-generator.js';

/**
 * Streaming telemetry analyzer - processes data in chunks without loading all into memory
 */
class StreamingTelemetryAnalyzer {
  constructor() {
    this.vehicleStats = new Map();
    this.recordCount = 0;
  }

  processChunk(records) {
    for (const record of records) {
      const telemetryRecord = {
        vehicle_id: record.vehicle_id,
        timestamp: new Date(record.timestamp),
        telemetry_name: record.telemetry_name,
        telemetry_value: parseFloat(record.telemetry_value),
        lap: parseInt(record.lap, 10)
      };

      this.recordCount++;
      const vid = telemetryRecord.vehicle_id;
      
      if (!this.vehicleStats.has(vid)) {
        this.vehicleStats.set(vid, {
          vehicle: vid,
          maxSpeed: -Infinity,
          speedSum: 0,
          speedCount: 0,
          maxBrakeFront: -Infinity,
          maxBrakeRear: -Infinity
        });
      }

      const stats = this.vehicleStats.get(vid);
      const telemetryName = telemetryRecord.telemetry_name;
      const telemetryValue = telemetryRecord.telemetry_value;

      // Update statistics incrementally
      if (telemetryName === 'speed_can' || telemetryName === 'speed') {
        stats.maxSpeed = Math.max(stats.maxSpeed, telemetryValue);
        stats.speedSum += telemetryValue;
        stats.speedCount++;
      } else if (telemetryName === 'brake_front' || telemetryName === 'brake_front_can') {
        stats.maxBrakeFront = Math.max(stats.maxBrakeFront, telemetryValue);
      } else if (telemetryName === 'brake_rear' || telemetryName === 'brake_rear_can') {
        stats.maxBrakeRear = Math.max(stats.maxBrakeRear, telemetryValue);
      }
    }
  }

  getResults() {
    const byVehicle = new Map();
    let maxSpeed = -Infinity;
    let avgSpeedSum = 0;
    let avgSpeedCount = 0;
    let maxBrakeFront = -Infinity;
    let maxBrakeRear = -Infinity;

    for (const [vid, stats] of this.vehicleStats.entries()) {
      const vehicleResult = {
        vehicle: vid,
        maxSpeed: stats.maxSpeed > -Infinity ? stats.maxSpeed : null,
        avgSpeed: stats.speedCount > 0 ? stats.speedSum / stats.speedCount : null,
        maxBrakeFront: stats.maxBrakeFront > -Infinity ? stats.maxBrakeFront : null,
        maxBrakeRear: stats.maxBrakeRear > -Infinity ? stats.maxBrakeRear : null
      };
      
      byVehicle.set(vid, vehicleResult);

      // Update overall stats
      if (vehicleResult.maxSpeed !== null) {
        maxSpeed = Math.max(maxSpeed, vehicleResult.maxSpeed);
        avgSpeedSum += stats.speedSum;
        avgSpeedCount += stats.speedCount;
      }
      if (vehicleResult.maxBrakeFront !== null) {
        maxBrakeFront = Math.max(maxBrakeFront, vehicleResult.maxBrakeFront);
      }
      if (vehicleResult.maxBrakeRear !== null) {
        maxBrakeRear = Math.max(maxBrakeRear, vehicleResult.maxBrakeRear);
      }
    }

    return {
      maxSpeed: maxSpeed > -Infinity ? maxSpeed : null,
      avgSpeed: avgSpeedCount > 0 ? avgSpeedSum / avgSpeedCount : null,
      maxBrakeFront: maxBrakeFront > -Infinity ? maxBrakeFront : null,
      maxBrakeRear: maxBrakeRear > -Infinity ? maxBrakeRear : null,
      byVehicle,
      recordCount: this.recordCount
    };
  }
}

/**
 * Run complete analysis pipeline with streaming telemetry
 */
async function exploreAllStreaming() {
  try {
    console.log('🏁 Complete Race Data Analysis (Memory-Efficient Streaming)');
    console.log('='.repeat(70));
    console.log();

    const allAnalysis = {};

    // ===== Load and Analyze Lap Times =====
    console.log('📂 [1/5] Loading lap time data...');
    const lapData = await parseLapTimes('COTA_lap_time_R1.csv');
    console.log(`   ✓ Loaded ${lapData.length} lap records`);
    
    console.log('📊 Analyzing lap times...');
    allAnalysis.laps = analyzeLapTimes(lapData);
    console.log(`   ✓ Analyzed ${allAnalysis.laps.rankings.length} vehicles`);
    console.log();

    // ===== Load and Analyze Race Results =====
    console.log('📂 [2/5] Loading race results data...');
    const resultsData = await parseRaceResults('00_Results GR Cup Race 1 Official_Anonymized.CSV');
    console.log(`   ✓ Loaded ${resultsData.length} race results`);
    
    console.log('📊 Analyzing race results...');
    allAnalysis.results = analyzeRaceResults(resultsData);
    console.log(`   ✓ Analyzed ${allAnalysis.results.totalVehicles} vehicles`);
    console.log();

    // ===== Stream and Analyze Telemetry =====
    console.log('📂 [3/5] Streaming telemetry data...');
    console.log('   (Processing in chunks to minimize memory usage)');
    
    const telemetryAnalyzer = new StreamingTelemetryAnalyzer();
    let chunkCount = 0;
    
    await parseCSVStream('R1_cota_telemetry_data.csv', ',', (records) => {
      telemetryAnalyzer.processChunk(records);
      chunkCount++;
      if (chunkCount % 10 === 0) {
        process.stdout.write(`\r   Processing chunk ${chunkCount}... (${telemetryAnalyzer.recordCount} records)`);
      }
    });
    
    console.log(`\n   ✓ Processed ${telemetryAnalyzer.recordCount} telemetry records`);
    
    allAnalysis.telemetry = telemetryAnalyzer.getResults();
    console.log(`   ✓ Analyzed ${allAnalysis.telemetry.byVehicle.size} vehicles`);
    console.log();

    // ===== Load and Analyze Weather =====
    console.log('📂 [4/5] Loading weather data...');
    const weatherData = await parseWeather('26_Weather_Race 1_Anonymized.CSV');
    console.log(`   ✓ Loaded ${weatherData.length} weather records`);
    
    console.log('📊 Analyzing weather data...');
    allAnalysis.weather = analyzeWeather(weatherData);
    console.log('   ✓ Analysis complete');
    console.log();

    // ===== Load and Analyze Sections =====
    console.log('📂 [5/5] Loading section analysis data...');
    const sectionData = await parseSections('23_AnalysisEnduranceWithSections_Race 1_Anonymized.CSV');
    console.log(`   ✓ Loaded ${sectionData.length} section records`);
    
    console.log('📊 Analyzing section performance...');
    allAnalysis.sections = analyzeSections(sectionData);
    console.log('   ✓ Analysis complete');
    console.log();

    // ===== Calculate Race Duration =====
    if (lapData.length > 0) {
      const timestamps = lapData.map(r => r.timestamp.getTime());
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      allAnalysis.duration = maxTime - minTime;
    }

    // ===== Generate All Reports =====
    console.log('📝 Generating reports...');
    console.log('   → lap-analysis-report.md');
    await generateLapReport(allAnalysis.laps, 'lap-analysis-report.md');
    
    console.log('   → race-results-report.md');
    await generateResultsReport(allAnalysis.results, resultsData, 'race-results-report.md');
    
    console.log('   → telemetry-analysis-report.md');
    await generateTelemetryReport(allAnalysis.telemetry, 'telemetry-analysis-report.md');
    
    console.log('   → weather-analysis-report.md');
    await generateWeatherReport(allAnalysis.weather, 'weather-analysis-report.md');
    
    console.log('   → section-analysis-report.md');
    await generateSectionReport(allAnalysis.sections, 'section-analysis-report.md');
    
    console.log('   → race-summary-report.md');
    await generateSummaryReport(allAnalysis, 'race-summary-report.md');
    
    console.log('   ✓ All reports generated');
    console.log();

    // ===== Print Comprehensive Summary =====
    console.log('='.repeat(70));
    console.log('📈 COMPREHENSIVE RACE SUMMARY');
    console.log('='.repeat(70));
    console.log();

    // Race Overview
    console.log('🏁 RACE OVERVIEW');
    console.log('-'.repeat(70));
    console.log(`Total Vehicles:      ${allAnalysis.results.totalVehicles}`);
    
    const totalLaps = allAnalysis.laps.rankings.reduce((sum, r) => sum + r.lapCount, 0);
    console.log(`Total Laps:          ${totalLaps}`);
    
    if (allAnalysis.duration) {
      console.log(`Race Duration:       ${formatLapTime(allAnalysis.duration)}`);
    }
    
    console.log(`Fastest Lap:         ${formatLapTime(allAnalysis.laps.fastest)}`);
    console.log();

    // Winner
    if (allAnalysis.results.winner) {
      console.log('🏆 RACE WINNER');
      console.log('-'.repeat(70));
      console.log(`Car #${allAnalysis.results.winner.number}`);
      console.log(`  Total Time:        ${allAnalysis.results.winner.total_time}`);
      console.log(`  Laps:              ${allAnalysis.results.winner.laps}`);
      console.log(`  Best Lap:          ${allAnalysis.results.winner.best_lap_time}`);
      console.log(`  Class:             ${allAnalysis.results.winner.class}`);
      console.log();
    }

    // Lap Performance
    console.log('⏱️  LAP PERFORMANCE');
    console.log('-'.repeat(70));
    console.log(`Fastest Lap:         ${formatLapTime(allAnalysis.laps.fastest)}`);
    console.log(`Average Lap:         ${formatLapTime(allAnalysis.laps.average)}`);
    console.log(`Std Deviation:       ${formatNumber(allAnalysis.laps.stdDev / 1000, 3)}s`);
    console.log();
    console.log('Top 3 Vehicles:');
    allAnalysis.laps.rankings.slice(0, 3).forEach(r => {
      console.log(`  ${r.rank}. ${r.vehicle.padEnd(15)} - ${formatLapTime(r.fastest)}`);
    });
    console.log();

    // Telemetry
    console.log('🚗 TELEMETRY HIGHLIGHTS');
    console.log('-'.repeat(70));
    console.log(`Max Speed:           ${formatNumber(allAnalysis.telemetry.maxSpeed, 2)} km/h`);
    console.log(`Avg Speed:           ${formatNumber(allAnalysis.telemetry.avgSpeed, 2)} km/h`);
    console.log(`Max Brake Front:     ${formatNumber(allAnalysis.telemetry.maxBrakeFront, 2)} bar`);
    console.log(`Max Brake Rear:      ${formatNumber(allAnalysis.telemetry.maxBrakeRear, 2)} bar`);
    console.log();

    // Weather
    console.log('🌤️  WEATHER CONDITIONS');
    console.log('-'.repeat(70));
    console.log(`Air Temp:            ${formatNumber(allAnalysis.weather.avgAirTemp, 1)}°C (${formatNumber(allAnalysis.weather.minTemp, 1)}°C - ${formatNumber(allAnalysis.weather.maxTemp, 1)}°C)`);
    console.log(`Track Temp:          ${formatNumber(allAnalysis.weather.avgTrackTemp, 1)}°C`);
    console.log(`Humidity:            ${formatNumber(allAnalysis.weather.avgHumidity, 1)}%`);
    console.log(`Wind Speed:          ${formatNumber(allAnalysis.weather.avgWindSpeed, 1)} km/h`);
    
    if (allAnalysis.weather.rainPeriods && allAnalysis.weather.rainPeriods.length > 0) {
      console.log(`Rain Periods:        ${allAnalysis.weather.rainPeriods.length}`);
    } else {
      console.log(`Rain:                No rain detected`);
    }
    console.log();

    // Sections
    console.log('🛣️  TRACK SECTIONS');
    console.log('-'.repeat(70));
    for (const section of ['S1', 'S2', 'S3']) {
      const fastest = allAnalysis.sections.fastestBySection.get(section);
      const vehicle = allAnalysis.sections.fastestVehicleBySection.get(section);
      const avg = allAnalysis.sections.avgBySection.get(section);
      
      if (fastest && vehicle && avg) {
        console.log(`${section}: ${formatLapTime(fastest)} (Vehicle #${vehicle.vehicle}) | Avg: ${formatLapTime(avg)}`);
      }
    }
    console.log();

    console.log('='.repeat(70));
    console.log('✅ Complete race data exploration finished!');
    console.log('📄 All reports saved to current directory');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error during complete race data exploration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the complete exploration
exploreAllStreaming();
