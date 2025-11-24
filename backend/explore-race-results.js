import { parseRaceResults } from './parsers/results-parser.js';
import { analyzeRaceResults } from './analyzers/results-analyzer.js';
import { generateResultsReport } from './reporters/results-report.js';

/**
 * Explore race results data
 * Loads race results, analyzes them, generates a report, and prints summary
 */
async function exploreRaceResults() {
  try {
    console.log('🏁 Race Results Analysis');
    console.log('='.repeat(50));
    console.log();

    // Load race results data
    console.log('📂 Loading race results data...');
    const resultsData = await parseRaceResults('00_Results GR Cup Race 1 Official_Anonymized.CSV');
    console.log(`✓ Loaded ${resultsData.length} race results`);
    console.log();

    // Run analysis
    console.log('📊 Analyzing race results...');
    const analysis = analyzeRaceResults(resultsData);
    console.log(`✓ Analyzed ${analysis.totalVehicles} vehicles`);
    console.log();

    // Generate report
    console.log('📝 Generating results report...');
    await generateResultsReport(analysis, resultsData, 'race-results-report.md');
    console.log('✓ Report saved to race-results-report.md');
    console.log();

    // Print summary to console
    console.log('📈 Summary');
    console.log('-'.repeat(50));
    
    if (analysis.winner) {
      console.log(`🏆 Winner:        Car #${analysis.winner.number}`);
      console.log(`   Total Time:   ${analysis.winner.total_time}`);
      console.log(`   Laps:         ${analysis.winner.laps}`);
      console.log(`   Best Lap:     ${analysis.winner.best_lap_time}`);
      console.log(`   Class:        ${analysis.winner.class}`);
    }
    console.log();
    console.log(`Total Vehicles:  ${analysis.totalVehicles}`);
    console.log();

    // Class breakdown
    if (analysis.byClass.size > 0) {
      console.log('📊 Class Breakdown');
      console.log('-'.repeat(50));
      for (const [className, vehicles] of analysis.byClass.entries()) {
        console.log(`${className}: ${vehicles.length} vehicles`);
      }
      console.log();
    }

    // Top 5 finishers
    console.log('🏆 Top 5 Finishers');
    console.log('-'.repeat(50));
    const top5 = resultsData
      .sort((a, b) => a.position - b.position)
      .slice(0, 5);
    top5.forEach(result => {
      console.log(`${result.position}. Car #${result.number.toString().padEnd(3)} - ${result.total_time} (${result.laps} laps)`);
    });
    console.log();

    console.log('✅ Race results exploration complete!');
  } catch (error) {
    console.error('❌ Error during race results exploration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the exploration
exploreRaceResults();
