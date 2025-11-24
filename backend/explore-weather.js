import { parseWeather } from './parsers/weather-parser.js';
import { analyzeWeather } from './analyzers/weather-analyzer.js';
import { generateWeatherReport } from './reporters/weather-report.js';
import { formatNumber } from './reporters/markdown-generator.js';

/**
 * Explore weather data
 * Loads weather data, analyzes it, generates a report, and prints summary
 */
async function exploreWeather() {
  try {
    console.log('🏁 Weather Analysis');
    console.log('='.repeat(50));
    console.log();

    // Load weather data
    console.log('📂 Loading weather data...');
    const weatherData = await parseWeather('26_Weather_Race 1_Anonymized.CSV');
    console.log(`✓ Loaded ${weatherData.length} weather records`);
    console.log();

    // Run analysis
    console.log('📊 Analyzing weather data...');
    const analysis = analyzeWeather(weatherData);
    console.log('✓ Analysis complete');
    console.log();

    // Generate report
    console.log('📝 Generating weather report...');
    await generateWeatherReport(analysis, 'weather-analysis-report.md');
    console.log('✓ Report saved to weather-analysis-report.md');
    console.log();

    // Print summary to console
    console.log('📈 Summary');
    console.log('-'.repeat(50));
    console.log('Average Conditions:');
    console.log(`  Air Temp:      ${formatNumber(analysis.avgAirTemp, 2)}°C`);
    console.log(`  Track Temp:    ${formatNumber(analysis.avgTrackTemp, 2)}°C`);
    console.log(`  Humidity:      ${formatNumber(analysis.avgHumidity, 2)}%`);
    console.log(`  Pressure:      ${formatNumber(analysis.avgPressure, 2)} hPa`);
    console.log(`  Wind Speed:    ${formatNumber(analysis.avgWindSpeed, 2)} km/h`);
    console.log();
    console.log('Temperature Range:');
    console.log(`  Min:           ${formatNumber(analysis.minTemp, 2)}°C`);
    console.log(`  Max:           ${formatNumber(analysis.maxTemp, 2)}°C`);
    console.log(`  Range:         ${formatNumber(analysis.maxTemp - analysis.minTemp, 2)}°C`);
    console.log();
    console.log('Wind Speed Range:');
    console.log(`  Min:           ${formatNumber(analysis.minWindSpeed, 2)} km/h`);
    console.log(`  Max:           ${formatNumber(analysis.maxWindSpeed, 2)} km/h`);
    console.log(`  Range:         ${formatNumber(analysis.maxWindSpeed - analysis.minWindSpeed, 2)} km/h`);
    console.log();

    // Rain information
    if (analysis.rainPeriods && analysis.rainPeriods.length > 0) {
      console.log('🌧️  Rain Detected');
      console.log('-'.repeat(50));
      console.log(`Total rain periods: ${analysis.rainPeriods.length}`);
      console.log('First rain period:', analysis.rainPeriods[0].timestamp.toISOString());
      console.log('Last rain period:', analysis.rainPeriods[analysis.rainPeriods.length - 1].timestamp.toISOString());
    } else {
      console.log('☀️  No Rain Detected');
      console.log('-'.repeat(50));
      console.log('Dry conditions throughout the session');
    }
    console.log();

    console.log('✅ Weather exploration complete!');
  } catch (error) {
    console.error('❌ Error during weather exploration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the exploration
exploreWeather();
