import { parseSections } from './parsers/section-parser.js';
import { analyzeSections } from './analyzers/section-analyzer.js';
import { generateSectionReport } from './reporters/section-report.js';
import { formatLapTime } from './reporters/markdown-generator.js';

/**
 * Explore section analysis data
 * Loads section data, analyzes it, generates a report, and prints summary
 */
async function exploreSections() {
  try {
    console.log('🏁 Section Analysis');
    console.log('='.repeat(50));
    console.log();

    // Load section analysis data
    console.log('📂 Loading section analysis data...');
    const sectionData = await parseSections('23_AnalysisEnduranceWithSections_Race 1_Anonymized.CSV');
    console.log(`✓ Loaded ${sectionData.length} section records`);
    console.log();

    // Run analysis
    console.log('📊 Analyzing section performance...');
    const analysis = analyzeSections(sectionData);
    console.log('✓ Analysis complete');
    console.log();

    // Generate report
    console.log('📝 Generating section report...');
    await generateSectionReport(analysis, 'section-analysis-report.md');
    console.log('✓ Report saved to section-analysis-report.md');
    console.log();

    // Print summary to console
    console.log('📈 Summary');
    console.log('-'.repeat(50));
    console.log();

    // Fastest times per section
    console.log('⚡ Fastest Times by Section');
    console.log('-'.repeat(50));
    for (const section of ['S1', 'S2', 'S3']) {
      const fastestTime = analysis.fastestBySection.get(section);
      const fastestVehicle = analysis.fastestVehicleBySection.get(section);
      
      if (fastestTime && fastestVehicle) {
        console.log(`${section}: ${formatLapTime(fastestTime)} (Vehicle #${fastestVehicle.vehicle})`);
      }
    }
    console.log();

    // Average times per section
    console.log('📊 Average Times by Section');
    console.log('-'.repeat(50));
    for (const section of ['S1', 'S2', 'S3']) {
      const avgTime = analysis.avgBySection.get(section);
      
      if (avgTime) {
        console.log(`${section}: ${formatLapTime(avgTime)}`);
      }
    }
    console.log();

    // Section comparison
    console.log('🔍 Section Performance Comparison');
    console.log('-'.repeat(50));
    for (const section of ['S1', 'S2', 'S3']) {
      const fastestTime = analysis.fastestBySection.get(section);
      const avgTime = analysis.avgBySection.get(section);
      
      if (fastestTime && avgTime) {
        const delta = avgTime - fastestTime;
        const percentage = ((delta / fastestTime) * 100).toFixed(2);
        console.log(`${section}: Average is ${formatLapTime(delta)} slower than fastest (${percentage}%)`);
      }
    }
    console.log();

    console.log('✅ Section analysis exploration complete!');
  } catch (error) {
    console.error('❌ Error during section analysis exploration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the exploration
exploreSections();
