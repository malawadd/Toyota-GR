# Racing Data API

REST API for Toyota GR Cup Series race data. Provides fast, scalable endpoints for frontend applications to access race data including vehicles, lap times, telemetry, results, sections, and weather.

## Project Structure

```
api/
├── database/          # Database schema and initialization
├── services/          # Business logic and data access
├── routes/            # API endpoint definitions
├── middleware/        # Request processing and validation
├── cache/             # Caching layer
├── tests/             # Test files
├── config.js          # Configuration management
├── server.js          # Server entry point
├── import-data.js     # CLI tool for data import
└── package.json       # Dependencies and scripts
```

## Installation

```bash
npm install
```

## Configuration

Configuration is managed through environment variables with sensible defaults:

- `PORT` - Server port (default: 3000)
- `DB_PATH` - SQLite database path (default: ./data/racing.db)
- `CACHE_ENABLED` - Enable caching (default: true)
- `CACHE_TTL` - Cache TTL in seconds (default: 300)
- `CORS_ORIGINS` - Allowed CORS origins (default: *)
- `LOG_LEVEL` - Logging level (default: info)
- `NODE_ENV` - Environment (development/production)

## Usage

### Import Data

First, import CSV race data into the database using the CLI import tool:

```bash
# Using npm script
npm run import -- /path/to/csv/files

# Or directly with node
node import-data.js /path/to/csv/files

# With custom database path
node import-data.js /path/to/csv/files --db ./custom.db

# With verbose logging
node import-data.js /path/to/csv/files --verbose

# Show help
node import-data.js --help
```

**Expected CSV Files:**
- Lap times: `*lap_time*.csv`
- Results: `*Results*.CSV`
- Telemetry: `*telemetry*.csv`
- Sections: `*Endurance*.CSV`
- Weather: `*Weather*.CSV`

**Import Process:**
1. Validates data directory exists
2. Initializes database with schema
3. Parses all CSV files
4. Imports data with progress reporting
5. Creates indexes for fast queries
6. Displays import summary

### Start Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Documentation

**📚 Complete API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

The comprehensive documentation includes:
- Detailed endpoint descriptions with all parameters
- Request/response examples with cURL, JavaScript, and Python
- Error codes and handling
- Query parameter reference
- Performance tips and best practices
- Postman collection for easy testing

**🔧 Postman Collection**: Import `Racing_Data_API.postman_collection.json` into Postman for instant access to all 37 pre-configured API requests.

### Quick Reference

**Base URL**: `http://localhost:3000/api`

**Main Endpoints**:
- `/health` - Health check
- `/vehicles` - Vehicle data and statistics
- `/telemetry` - High-frequency sensor data (speed, gear, throttle, brake)
- `/lap-times` - Lap timing data
- `/results` - Race results and positions
- `/sections` - Track sector times (S1, S2, S3)
- `/weather` - Weather conditions and measurements
- `/statistics` - Aggregated race statistics and leaderboards

**Example Request**:
```bash
curl http://localhost:3000/api/vehicles/GR86-004-78
```

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete details.

## Performance

- Most queries: < 100ms
- Statistics queries: < 50ms
- Cached responses: < 10ms
- Telemetry streaming: Real-time with configurable playback speed

## Testing

The project uses Vitest for testing with three types of tests:

1. **Unit Tests** - Test individual components in isolation
2. **Property-Based Tests** - Verify universal properties using fast-check
3. **Integration Tests** - Test complete API workflows using Supertest

## License

MIT
