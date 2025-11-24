# Racing Data Explorer

A Node.js-based system for analyzing Toyota GR Cup Series race data. This tool processes CSV files containing lap timing, race results, telemetry, weather, and track section data to generate comprehensive markdown reports and statistical analysis.

## Features

- 📊 **Lap Time Analysis** - Calculate fastest laps, averages, and consistency metrics
- 🏆 **Race Results Processing** - Analyze positions, gaps, and class breakdowns
- 🚗 **Telemetry Analysis** - Process speed, gear, throttle, and brake pressure data
- 🌤️ **Weather Monitoring** - Track temperature, humidity, wind, and rain conditions
- 🛣️ **Section Performance** - Analyze track section times (S1, S2, S3)
- 🏎️ **Vehicle Query** - Get comprehensive data for any vehicle by ID or car number
- 📝 **Markdown Reports** - Generate formatted reports for easy sharing
- 💾 **Streaming Support** - Efficiently handle large telemetry files (50MB+)

## Installation

### Prerequisites

- Node.js v18 or higher
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd racing-data-explorer
```

2. Install dependencies:
```bash
npm install
```

## Project Structure

```
racing-data-explorer/
├── parsers/           # CSV parsing modules
│   ├── base-parser.js
│   ├── lap-time-parser.js
│   ├── results-parser.js
│   ├── telemetry-parser.js
│   ├── weather-parser.js
│   └── section-parser.js
├── analyzers/         # Data analysis modules
│   ├── lap-analyzer.js
│   ├── results-analyzer.js
│   ├── telemetry-analyzer.js
│   ├── weather-analyzer.js
│   ├── section-analyzer.js
│   └── vehicle-analyzer.js
├── queries/           # Data query modules
│   └── vehicle-query.js
├── reporters/         # Report generation modules
│   ├── markdown-generator.js
│   ├── lap-report.js
│   ├── results-report.js
│   ├── telemetry-report.js
│   ├── weather-report.js
│   ├── section-report.js
│   ├── summary-report.js
│   └── vehicle-report.js
├── tests/            # Test files
├── explore-*.js      # Example exploration scripts
└── index.js          # Main entry point
```

## Usage

### Quick Start - Complete Analysis

Run the comprehensive analysis pipeline that processes all data types:

```bash
# Memory-efficient streaming version (recommended for large telemetry files)
npm run explore:all-streaming

# Standard version with increased memory
npm run explore:all

# For very large files (requires 16GB RAM)
npm run explore:all-large
```

**⚠️ Memory Issues?** If you encounter "JavaScript heap out of memory" errors, see [MEMORY-OPTIMIZATION-GUIDE.md](./MEMORY-OPTIMIZATION-GUIDE.md) for solutions.

This will:
- Load all CSV data files
- Run all analyses
- Generate all reports
- Display a comprehensive summary

### Individual Analysis Scripts

Run specific analyses for focused exploration:

#### Lap Time Analysis
```bash
node explore-lap-times.js
```
Analyzes lap timing data and generates `lap-analysis-report.md`

#### Race Results Analysis
```bash
node explore-race-results.js
```
Processes race results and generates `race-results-report.md`

#### Telemetry Analysis
```bash
node explore-telemetry.js
```
Analyzes telemetry data (with automatic streaming for large files) and generates `telemetry-analysis-report.md`

#### Weather Analysis
```bash
node explore-weather.js
```
Examines weather conditions and generates `weather-analysis-report.md`

#### Section Analysis
```bash
node explore-sections.js
```
Analyzes track section performance and generates `section-analysis-report.md`

### Vehicle-Specific Query

Query comprehensive data for a specific vehicle across all datasets:

```bash
# Query by vehicle ID
node query-vehicle.js GR86-004-78

# Query by car number
node query-vehicle.js 46
```

This powerful feature allows you to retrieve all information for a specific racer or vehicle in one command. The system will:
- Load all race data files (lap times, results, telemetry, sections)
- Filter data for the specified vehicle
- Generate a unified vehicle report
- Display a comprehensive summary

#### Vehicle ID vs Car Number

The system supports two ways to identify vehicles:

- **Vehicle ID**: A unique identifier like `GR86-004-78` (found in lap time and telemetry data)
- **Car Number**: The racing number displayed on the vehicle like `46` or `78` (found in race results)

The system automatically resolves car numbers to vehicle IDs when needed, so you can use whichever identifier you have available.

#### Example Output

When you run a vehicle query, you'll see:

```
🏎️  Vehicle Query
==================================================
Querying: Car #46

📂 Loading race data files...
✓ Loaded 340 lap time records
✓ Loaded 17 race results
✓ Loaded 85 section records
✓ Loaded 641845 telemetry records for vehicle

🔍 Querying vehicle data...
✓ Vehicle data retrieved

📊 Analyzing vehicle data...
✓ Analysis complete

📝 Generating vehicle report...
✓ Report saved to vehicle-46-report.md

📈 Summary
--------------------------------------------------
Vehicle ID:      GR86-004-78
Car Number:      #46
Class:           Am

🏁 Performance
--------------------------------------------------
Position:        5
Total Laps:      20
Fastest Lap:     2:29.245
Average Lap:     3:26.551
Max Speed:       209.8 km/h
Consistency:     79.31%

📊 Data Availability
--------------------------------------------------
Lap Data:        ✓
Race Result:     ✓
Telemetry:       ✓
Section Data:    ✓

✅ Vehicle query complete!
```

The generated report (`vehicle-46-report.md`) includes:
- **Overview**: Vehicle identification and key statistics
- **Lap Times**: Detailed lap time analysis with fastest, average, and consistency metrics
- **Race Results**: Final position, total laps, and race time
- **Telemetry**: Speed statistics, brake pressures, and throttle data
- **Section Analysis**: Performance breakdown by track sections (S1, S2, S3)

#### Handling Non-Existent Vehicles

If you query a vehicle that doesn't exist in the dataset:

```bash
node query-vehicle.js 999
```

The system will gracefully handle it:
```
❌ Vehicle not found in any dataset

💡 Tips:
   - Check if the vehicle ID or car number is correct
   - Try using a different identifier (vehicle ID vs car number)
   - Verify the vehicle participated in this race
```

### Using as a Module

You can also use the system programmatically:

```javascript
import { parseLapTimes } from './parsers/lap-time-parser.js';
import { analyzeLapTimes } from './analyzers/lap-analyzer.js';
import { generateLapReport } from './reporters/lap-report.js';

// Load data
const lapData = await parseLapTimes('COTA_lap_time_R1.csv');

// Analyze
const analysis = analyzeLapTimes(lapData);

// Generate report
await generateLapReport(analysis, 'my-lap-report.md');

// Access results
console.log(`Fastest lap: ${analysis.fastest}ms`);
console.log(`Top vehicle: ${analysis.rankings[0].vehicle}`);
```

## Data File Formats

The system expects CSV files in the following formats:

### Lap Time Data
- **File pattern**: `COTA_lap_time_*.csv`
- **Delimiter**: Comma (`,`)
- **Key fields**: `vehicle_id`, `lap`, `value` (milliseconds), `timestamp`

### Race Results
- **File pattern**: `*_Results*.CSV`
- **Delimiter**: Semicolon (`;`)
- **Key fields**: `POSITION`, `NUMBER`, `LAPS`, `TOTAL_TIME`, `GAP_FIRST`, `GAP_PREVIOUS`, `FL_TIME`, `CLASS`

### Telemetry Data
- **File pattern**: `*_telemetry_data.csv`
- **Delimiter**: Comma (`,`)
- **Key fields**: `vehicle_id`, `timestamp`, `telemetry_name`, `telemetry_value`, `lap`
- **Note**: Automatically uses streaming for files > 50MB

### Weather Data
- **File pattern**: `*_Weather*.CSV`
- **Delimiter**: Semicolon (`;`)
- **Key fields**: `TIME_UTC_SECONDS`, `AIR_TEMP`, `TRACK_TEMP`, `HUMIDITY`, `PRESSURE`, `WIND_SPEED`, `WIND_DIRECTION`, `RAIN`

### Section Analysis
- **File pattern**: `*_AnalysisEnduranceWithSections*.CSV`
- **Delimiter**: Semicolon (`;`)
- **Key fields**: `NUMBER`, `LAP_NUMBER`, `LAP_TIME`, `S1`, `S2`, `S3`, `TOP_SPEED`

## Output Reports

All reports are generated in Markdown format (`.md` files) and include:

- **Formatted tables** with race data
- **Statistical summaries** (averages, min/max, standard deviation)
- **Rankings and comparisons**
- **Visual indicators** (🏆 for winners, 🌧️ for rain, etc.)

### Example Report Structure

```markdown
# Lap Time Analysis Report

## Overall Statistics
- **Fastest Lap**: 2:28.630
- **Average Lap**: 2:45.123
- **Standard Deviation**: 5.234s

## Vehicle Rankings
| Rank | Vehicle | Fastest Lap | Average Lap | Std Dev | Lap Count | Consistency |
|------|---------|-------------|-------------|---------|-----------|-------------|
| 1    | GR86-004-78 | 2:28.630 | 2:30.145 | 1.234s | 17 | 0.82% |
...
```

## Testing

Run the test suite:

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

The project includes:
- **Unit tests** for individual functions
- **Property-based tests** using fast-check
- **Integration tests** for end-to-end workflows

## Error Handling

The system includes comprehensive error handling:

- **File not found**: Logs error with file path and continues
- **Malformed CSV rows**: Logs row number and error, skips row
- **Invalid numeric values**: Logs warning, uses null/NaN
- **Memory constraints**: Automatically switches to streaming for large files
- **Unexpected errors**: Logs stack trace and exits gracefully

## Performance

- **CSV Parsing**: 10,000+ records/second
- **Analysis**: Sub-second for typical race data
- **Report Generation**: Sub-second for all reports
- **Large File Handling**: Streaming mode for files > 50MB
- **Total Pipeline**: < 10 seconds for complete race dataset

## API Reference

### Parsers

#### `parseLapTimes(filePath)`
Parses lap timing CSV files.
- **Returns**: `Promise<Array<Object>>` - Array of lap time records

#### `parseRaceResults(filePath)`
Parses race results CSV files.
- **Returns**: `Promise<Array<Object>>` - Array of race result records

#### `parseTelemetry(filePath, onChunk?)`
Parses telemetry CSV files with automatic streaming.
- **Parameters**: 
  - `filePath` - Path to CSV file
  - `onChunk` - Optional callback for streaming mode
- **Returns**: `Promise<Array<Object>>` - Array of telemetry records

#### `parseWeather(filePath)`
Parses weather CSV files.
- **Returns**: `Promise<Array<Object>>` - Array of weather records

#### `parseSections(filePath)`
Parses section analysis CSV files.
- **Returns**: `Promise<Array<Object>>` - Array of section records

### Analyzers

#### `analyzeLapTimes(lapRecords)`
Analyzes lap time data for all vehicles.
- **Returns**: Object with `fastest`, `average`, `stdDev`, `byVehicle`, `rankings`

#### `analyzeRaceResults(resultRecords)`
Analyzes race results data.
- **Returns**: Object with `winner`, `totalVehicles`, `gaps`, `byClass`

#### `analyzeTelemetry(telemetryRecords, vehicleId?)`
Analyzes telemetry data.
- **Returns**: Object with `maxSpeed`, `avgSpeed`, `maxBrakeFront`, `maxBrakeRear`, `byVehicle`

#### `analyzeWeather(weatherRecords)`
Analyzes weather data.
- **Returns**: Object with averages, min/max values, and `rainPeriods`

#### `analyzeSections(sectionRecords)`
Analyzes section performance data.
- **Returns**: Object with `fastestBySection`, `avgBySection`, `fastestVehicleBySection`

#### `analyzeVehicleData(vehicleData)`
Analyzes comprehensive vehicle data across all datasets.
- **Parameters**: `vehicleData` - Object containing lap times, race results, telemetry, and sections for a specific vehicle
- **Returns**: Object with `vehicleId`, `carNumber`, `class`, `overallStatistics`, and detailed analysis for each data type

### Query Functions

#### `queryVehicle(vehicleIdentifier, allData)`
Queries and aggregates data for a specific vehicle across all datasets.
- **Parameters**:
  - `vehicleIdentifier` - Vehicle ID (string) or car number (number)
  - `allData` - Object containing `{ lapTimes, results, telemetry, sections }`
- **Returns**: `Promise<VehicleData>` - Unified vehicle data object

#### `resolveVehicleId(carNumber, results)`
Resolves a car number to its corresponding vehicle ID.
- **Parameters**:
  - `carNumber` - Racing number (e.g., 46, 78)
  - `results` - Array of race result records
- **Returns**: `string` - Vehicle ID or `null` if not found

#### `filterByVehicle(records, vehicleId)`
Filters records to only those matching a specific vehicle ID.
- **Parameters**:
  - `records` - Array of records with `vehicle_id` field
  - `vehicleId` - Vehicle ID to filter by
- **Returns**: `Array<Object>` - Filtered records

### Report Generators

#### `generateLapReport(analysis, outputPath)`
Generates markdown report for lap time analysis.

#### `generateResultsReport(analysis, resultRecords, outputPath)`
Generates markdown report for race results.

#### `generateTelemetryReport(analysis, outputPath)`
Generates markdown report for telemetry analysis.

#### `generateWeatherReport(analysis, outputPath)`
Generates markdown report for weather analysis.

#### `generateSectionReport(analysis, outputPath)`
Generates markdown report for section analysis.

#### `generateSummaryReport(allAnalysis, outputPath)`
Generates comprehensive summary report from all analyses.

#### `generateVehicleReport(vehicleAnalysis, outputPath)`
Generates unified markdown report for a specific vehicle.
- **Parameters**:
  - `vehicleAnalysis` - Analysis object from `analyzeVehicleData()`
  - `outputPath` - Path for output markdown file
- **Returns**: `Promise<void>`

## Programmatic Usage Example

Here's how to use the vehicle query functionality in your own code:

```javascript
import { parseLapTimes } from './parsers/lap-time-parser.js';
import { parseRaceResults } from './parsers/results-parser.js';
import { parseTelemetry } from './parsers/telemetry-parser.js';
import { parseSections } from './parsers/section-parser.js';
import { queryVehicle } from './queries/vehicle-query.js';
import { analyzeVehicleData } from './analyzers/vehicle-analyzer.js';
import { generateVehicleReport } from './reporters/vehicle-report.js';

// Load all data
const lapTimes = await parseLapTimes('COTA_lap_time_R1.csv');
const results = await parseRaceResults('00_Results GR Cup Race 1 Official_Anonymized.CSV');
const sections = await parseSections('23_AnalysisEnduranceWithSections_Race 1_Anonymized.CSV');

// Stream telemetry for specific vehicle
const telemetry = [];
await parseTelemetry('R1_cota_telemetry_data.csv', (records) => {
  const filtered = records.filter(r => r.vehicle_id === 'GR86-004-78');
  telemetry.push(...filtered);
});

// Query vehicle by car number
const allData = { lapTimes, results, telemetry, sections };
const vehicleData = await queryVehicle(46, allData);

// Analyze
const analysis = analyzeVehicleData(vehicleData);

// Generate report
await generateVehicleReport(analysis, 'vehicle-46-report.md');

// Access specific statistics
console.log(`Fastest lap: ${analysis.overallStatistics.fastestLap}ms`);
console.log(`Position: ${analysis.overallStatistics.position}`);
console.log(`Max speed: ${analysis.overallStatistics.maxSpeed} km/h`);
```

## Contributing

Contributions are welcome! Please ensure:
- All tests pass (`npm test`)
- Code follows existing style
- New features include tests
- Documentation is updated

## License

MIT

## Support

For issues or questions, please open an issue on the repository.

---

*Built for Toyota GR Cup Series race data analysis*
