# Racing Data API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [Response Format](#response-format)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [API Endpoints](#api-endpoints)
   - [Health](#health)
   - [Vehicles](#vehicles)
   - [Telemetry](#telemetry)
   - [Lap Times](#lap-times)
   - [Race Results](#race-results)
   - [Section Times](#section-times)
   - [Weather](#weather)
   - [Statistics](#statistics)
8. [Query Parameters](#query-parameters)
9. [Examples](#examples)
10. [Postman Collection](#postman-collection)

---

## Overview

The Racing Data API provides fast, RESTful access to Toyota GR Cup Series race data. The API is optimized for performance with sub-100ms response times for most queries through strategic caching and database indexing.

**Base URL**: `http://localhost:3000/api`

**Version**: 1.0.0

**Data Format**: JSON

**Performance Targets**:
- Cached responses: < 10ms
- Simple queries: < 50ms
- Telemetry queries: < 100ms
- Statistics queries: < 50ms

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- Imported race data (see README.md for import instructions)

### Quick Start

```bash
# Start the API server
cd api
npm start

# Test the API
curl http://localhost:3000/api/health
```


---

## Authentication

**Current Version**: No authentication required

**Future Versions**: JWT-based authentication and API keys will be supported

---

## Response Format

All API responses follow a consistent structure:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 100,
    "total": 500,
    "responseTime": 45
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { }
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the request was successful |
| `data` | object/array | Response data (varies by endpoint) |
| `meta` | object | Metadata about the response (pagination, timing, etc.) |
| `error` | object | Error information (only present on failures) |

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 400 | Bad Request - Invalid parameters or malformed request |
| 404 | Not Found - Resource does not exist |
| 405 | Method Not Allowed - Unsupported HTTP method |
| 500 | Internal Server Error - Database or server error |
| 503 | Service Unavailable - Health check failed |


### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VEHICLE_NOT_FOUND` | Vehicle ID does not exist | 404 |
| `INVALID_VEHICLE_ID` | Vehicle ID format is invalid | 400 |
| `INVALID_PAGINATION` | Page or limit parameters are invalid | 400 |
| `INVALID_LAP_RANGE` | Lap range parameters are invalid | 400 |
| `INVALID_TIME_RANGE` | Time range parameters are invalid | 400 |
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `DATABASE_ERROR` | Database query or connection error | 500 |
| `IMPORT_ERROR` | Data import failed | 500 |
| `CACHE_ERROR` | Cache operation failed | 500 |
| `TELEMETRY_NOT_FOUND` | No telemetry data found | 404 |
| `SECTION_NOT_FOUND` | Section times not found | 404 |
| `NO_WEATHER_DATA` | No weather data found | 404 |
| `STREAM_ERROR` | Failed to establish stream | 500 |
| `HEALTH_CHECK_ERROR` | Health check failed | 500 |

### Error Response Example

```json
{
  "success": false,
  "error": {
    "code": "VEHICLE_NOT_FOUND",
    "message": "Vehicle with ID GR86-004-99 not found",
    "details": {
      "vehicleId": "GR86-004-99"
    }
  }
}
```

---

## Rate Limiting

**Current Version**: No rate limiting

**Future Versions**: Rate limiting will be implemented per IP address or API key

---


## API Endpoints

### Health

#### GET /api/health

Health check endpoint that returns system status, database connectivity, cache statistics, and uptime.

**Parameters**: None

**Response**:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-03-15T14:23:45.123Z",
    "uptime": {
      "milliseconds": 3600000,
      "seconds": 3600,
      "formatted": "0d 1h 0m 0s"
    },
    "database": {
      "status": "connected",
      "error": null
    },
    "cache": {
      "enabled": true,
      "keys": 42,
      "hits": 1250,
      "misses": 150,
      "hitRate": 0.893
    },
    "memory": {
      "heapUsed": 45,
      "heapTotal": 64,
      "rss": 128
    }
  }
}
```

**cURL Example**:

```bash
curl http://localhost:3000/api/health
```

---

### Vehicles

#### GET /api/vehicles

Get all vehicles with optional filtering and sorting.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `class` | string | No | Filter by vehicle class (e.g., 'Pro', 'Am') |
| `sortBy` | string | No | Sort field: `fastest_lap`, `average_lap`, `position`, `car_number`, `max_speed` |
| `order` | string | No | Sort order: `asc`, `desc` (default: `asc`) |

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "vehicleId": "GR86-004-78",
      "carNumber": 78,
      "class": "Am",
      "statistics": {
        "fastestLap": 148630,
        "averageLap": 152400,
        "totalLaps": 45,
        "maxSpeed": 185.3,
        "position": 5
      }
    }
  ],
  "meta": {
    "total": 25
  }
}
```

**cURL Examples**:

```bash
# Get all vehicles
curl http://localhost:3000/api/vehicles

# Filter by class
curl "http://localhost:3000/api/vehicles?class=Pro"

# Sort by fastest lap
curl "http://localhost:3000/api/vehicles?sortBy=fastest_lap&order=asc"
```


#### GET /api/vehicles/:id

Get detailed information for a specific vehicle.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Vehicle ID (format: `GR86-XXX-YY`) |

**Response**:

```json
{
  "success": true,
  "data": {
    "vehicleId": "GR86-004-78",
    "carNumber": 78,
    "class": "Am",
    "statistics": {
      "fastestLap": 148630,
      "averageLap": 152400,
      "totalLaps": 45,
      "maxSpeed": 185.3,
      "position": 5
    }
  }
}
```

**cURL Example**:

```bash
curl http://localhost:3000/api/vehicles/GR86-004-78
```

#### GET /api/vehicles/by-number/:carNumber

Get vehicle by car number.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `carNumber` | integer | Yes | Car number (e.g., 78) |

**Response**: Same as GET /api/vehicles/:id

**cURL Example**:

```bash
curl http://localhost:3000/api/vehicles/by-number/78
```

---

### Telemetry

#### GET /api/telemetry

Get telemetry data with filtering and pagination.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | string | Yes | Vehicle ID (format: `GR86-XXX-YY`) |
| `lap` | integer | No | Filter by lap number |
| `telemetryNames` | string | No | Comma-separated list of telemetry types |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Results per page (default: 100, max: 1000) |

**Telemetry Types**: `speed_can`, `gear`, `throttle_pos`, `brake_pos`, `rpm`, `steering_angle`

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 12345,
      "vehicle_id": "GR86-004-78",
      "lap": 10,
      "timestamp": "2024-03-15T14:23:45.123Z",
      "telemetry_name": "speed_can",
      "telemetry_value": 165.5
    }
  ],
  "meta": {
    "page": 1,
    "limit": 100,
    "total": 45000,
    "totalPages": 450,
    "hasNext": true,
    "hasPrev": false,
    "responseTime": 45
  }
}
```


**cURL Examples**:

```bash
# Get telemetry for a vehicle
curl "http://localhost:3000/api/telemetry?vehicleId=GR86-004-78"

# Get telemetry for a specific lap
curl "http://localhost:3000/api/telemetry?vehicleId=GR86-004-78&lap=10"

# Get only speed data
curl "http://localhost:3000/api/telemetry?vehicleId=GR86-004-78&telemetryNames=speed_can"

# Pagination
curl "http://localhost:3000/api/telemetry?vehicleId=GR86-004-78&page=2&limit=500"
```

#### GET /api/telemetry/vehicle/:vehicleId

Get telemetry data for a specific vehicle (alternative endpoint).

**Path Parameters**: Same as query parameter `vehicleId` above

**Query Parameters**: Same as GET /api/telemetry (except `vehicleId`)

**Response**: Same as GET /api/telemetry

**cURL Example**:

```bash
curl http://localhost:3000/api/telemetry/vehicle/GR86-004-78?lap=10
```

#### GET /api/telemetry/vehicle/:vehicleId/lap/:lap

Get telemetry data for a specific vehicle and lap.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | string | Yes | Vehicle ID |
| `lap` | integer | Yes | Lap number |

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `telemetryNames` | string | No | Comma-separated list of telemetry types |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Results per page (default: 100, max: 1000) |

**Response**: Same as GET /api/telemetry

**cURL Example**:

```bash
curl http://localhost:3000/api/telemetry/vehicle/GR86-004-78/lap/10
```


#### GET /api/telemetry/vehicle/:vehicleId/stats

Get aggregated telemetry statistics for a vehicle.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | string | Yes | Vehicle ID |

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lap` | integer | No | Filter by lap number |

**Response**:

```json
{
  "success": true,
  "data": {
    "maxSpeed": 185.3,
    "avgSpeed": 142.7,
    "maxBrake": 98.5,
    "avgBrake": 45.2,
    "maxThrottle": 100.0,
    "avgThrottle": 67.8,
    "maxRPM": 7500,
    "avgRPM": 5200
  },
  "meta": {
    "responseTime": 25
  }
}
```

**cURL Examples**:

```bash
# Get overall stats
curl http://localhost:3000/api/telemetry/vehicle/GR86-004-78/stats

# Get stats for specific lap
curl "http://localhost:3000/api/telemetry/vehicle/GR86-004-78/stats?lap=10"
```

#### GET /api/telemetry/stream/:vehicleId

Stream telemetry data using Server-Sent Events (SSE) for real-time race replay.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | string | Yes | Vehicle ID |

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lap` | integer | No | Filter by lap number |
| `telemetryNames` | string | No | Comma-separated list of telemetry types |
| `playbackSpeed` | float | No | Playback speed multiplier (default: 1.0, range: 0.1-10) |

**Response**: Server-Sent Events stream

**Event Types**:
- `connected`: Initial connection established
- `telemetry`: Telemetry data point
- `complete`: Stream completed
- `error`: Error occurred

**cURL Example**:

```bash
curl -N http://localhost:3000/api/telemetry/stream/GR86-004-78?playbackSpeed=2.0
```

**JavaScript Example**:

```javascript
const eventSource = new EventSource('http://localhost:3000/api/telemetry/stream/GR86-004-78?playbackSpeed=2.0');

eventSource.addEventListener('connected', (e) => {
  console.log('Connected:', JSON.parse(e.data));
});

eventSource.addEventListener('telemetry', (e) => {
  const data = JSON.parse(e.data);
  console.log('Telemetry:', data);
});

eventSource.addEventListener('complete', (e) => {
  console.log('Stream complete');
  eventSource.close();
});

eventSource.addEventListener('error', (e) => {
  console.error('Stream error:', e);
  eventSource.close();
});
```

---


### Lap Times

#### GET /api/lap-times

Get lap times with optional filtering.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | string | No | Filter by vehicle ID |
| `minLap` | integer | No | Minimum lap number |
| `maxLap` | integer | No | Maximum lap number |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Results per page (default: 100, max: 1000) |

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "vehicle_id": "GR86-004-78",
      "lap": 10,
      "lap_time": 148630,
      "timestamp": "2024-03-15T14:23:45.123Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 100,
    "total": 450,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false,
    "responseTime": 35
  }
}
```

**cURL Examples**:

```bash
# Get all lap times
curl http://localhost:3000/api/lap-times

# Filter by vehicle
curl "http://localhost:3000/api/lap-times?vehicleId=GR86-004-78"

# Filter by lap range
curl "http://localhost:3000/api/lap-times?minLap=10&maxLap=20"
```

#### GET /api/lap-times/vehicle/:vehicleId

Get lap times for a specific vehicle.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | string | Yes | Vehicle ID |

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `minLap` | integer | No | Minimum lap number |
| `maxLap` | integer | No | Maximum lap number |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Results per page (default: 100, max: 1000) |

**Response**: Same as GET /api/lap-times

**cURL Example**:

```bash
curl "http://localhost:3000/api/lap-times/vehicle/GR86-004-78?minLap=10&maxLap=20"
```


#### GET /api/lap-times/fastest

Get fastest lap times.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | No | Maximum records (default: 10, max: 100) |
| `vehicleId` | string | No | Filter by vehicle ID |
| `class` | string | No | Filter by vehicle class |

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "vehicle_id": "GR86-004-78",
      "lap": 15,
      "lap_time": 148630,
      "timestamp": "2024-03-15T14:23:45.123Z"
    }
  ],
  "meta": {
    "total": 10,
    "responseTime": 20
  }
}
```

**cURL Examples**:

```bash
# Get top 10 fastest laps
curl http://localhost:3000/api/lap-times/fastest

# Get top 20 fastest laps
curl "http://localhost:3000/api/lap-times/fastest?limit=20"

# Get fastest laps for Pro class
curl "http://localhost:3000/api/lap-times/fastest?class=Pro"
```

#### GET /api/lap-times/compare

Compare lap times for multiple vehicles.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleIds` | string | Yes | Comma-separated list of vehicle IDs |
| `minLap` | integer | No | Minimum lap number |
| `maxLap` | integer | No | Maximum lap number |

**Response**:

```json
{
  "success": true,
  "data": {
    "GR86-004-78": [
      {
        "id": 1,
        "vehicle_id": "GR86-004-78",
        "lap": 10,
        "lap_time": 148630,
        "timestamp": "2024-03-15T14:23:45.123Z"
      }
    ],
    "GR86-004-46": [
      {
        "id": 2,
        "vehicle_id": "GR86-004-46",
        "lap": 10,
        "lap_time": 149200,
        "timestamp": "2024-03-15T14:23:50.456Z"
      }
    ]
  },
  "meta": {
    "vehicleCount": 2,
    "totalLaps": 90,
    "responseTime": 40
  }
}
```

**cURL Example**:

```bash
curl "http://localhost:3000/api/lap-times/compare?vehicleIds=GR86-004-78,GR86-004-46&minLap=10&maxLap=20"
```

---


### Race Results

#### GET /api/results

Get all race results with optional filtering and sorting.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `class` | string | No | Filter by vehicle class |
| `sortBy` | string | No | Sort field: `position`, `laps`, `car_number`, `class` |
| `order` | string | No | Sort order: `asc`, `desc` (default: `asc`) |

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "vehicle_id": "GR86-004-78",
      "position": 5,
      "car_number": 78,
      "laps": 45,
      "total_time": "1:52:34.567",
      "gap_first": "+1:23.456",
      "gap_previous": "+0:12.345",
      "best_lap_time": "2:28.630",
      "class": "Am"
    }
  ],
  "meta": {
    "total": 25,
    "responseTime": 15
  }
}
```

**cURL Examples**:

```bash
# Get all results
curl http://localhost:3000/api/results

# Filter by class
curl "http://localhost:3000/api/results?class=Pro"

# Sort by laps completed
curl "http://localhost:3000/api/results?sortBy=laps&order=desc"
```

#### GET /api/results/vehicle/:vehicleId

Get race result for a specific vehicle.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | string | Yes | Vehicle ID |

**Response**: Single result object (same structure as array item above)

**cURL Example**:

```bash
curl http://localhost:3000/api/results/vehicle/GR86-004-78
```

#### GET /api/results/class/:class

Get race results filtered by vehicle class.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `class` | string | Yes | Vehicle class (e.g., 'Pro', 'Am') |

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sortBy` | string | No | Sort field: `position`, `laps`, `car_number` |
| `order` | string | No | Sort order: `asc`, `desc` |

**Response**: Same as GET /api/results

**cURL Example**:

```bash
curl http://localhost:3000/api/results/class/Pro
```

---


### Section Times

#### GET /api/sections

Get fastest section times with optional filtering.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `section` | string | No | Section to query: `s1`, `s2`, `s3` (default: `s1`) |
| `vehicleId` | string | No | Filter by vehicle ID |
| `class` | string | No | Filter by vehicle class |
| `limit` | integer | No | Maximum records (default: 10, max: 100) |

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "vehicle_id": "GR86-004-78",
      "lap": 15,
      "s1": 45.123,
      "s2": 52.456,
      "s3": 51.051,
      "lap_time": 148630,
      "top_speed": 185.3
    }
  ],
  "meta": {
    "section": "s1",
    "total": 10,
    "responseTime": 25
  }
}
```

**cURL Examples**:

```bash
# Get fastest S1 times
curl http://localhost:3000/api/sections

# Get fastest S2 times
curl "http://localhost:3000/api/sections?section=s2"

# Get fastest S1 times for Pro class
curl "http://localhost:3000/api/sections?section=s1&class=Pro&limit=20"
```

#### GET /api/sections/vehicle/:vehicleId

Get section times for a specific vehicle.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | string | Yes | Vehicle ID |

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `minLap` | integer | No | Minimum lap number |
| `maxLap` | integer | No | Maximum lap number |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Results per page (default: 100, max: 1000) |

**Response**: Same structure as GET /api/sections with pagination

**cURL Example**:

```bash
curl "http://localhost:3000/api/sections/vehicle/GR86-004-78?minLap=10&maxLap=20"
```


#### GET /api/sections/vehicle/:vehicleId/lap/:lap

Get section times for a specific vehicle and lap.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | string | Yes | Vehicle ID |
| `lap` | integer | Yes | Lap number |

**Response**: Single section time object

**cURL Example**:

```bash
curl http://localhost:3000/api/sections/vehicle/GR86-004-78/lap/10
```

#### GET /api/sections/leaders

Get section leaders (fastest vehicle for each section).

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `class` | string | No | Filter by vehicle class |
| `lap` | integer | No | Filter by specific lap number |

**Response**:

```json
{
  "success": true,
  "data": {
    "s1": {
      "vehicle_id": "GR86-004-78",
      "lap": 15,
      "time": 45.123
    },
    "s2": {
      "vehicle_id": "GR86-004-46",
      "lap": 12,
      "time": 52.456
    },
    "s3": {
      "vehicle_id": "GR86-004-78",
      "lap": 15,
      "time": 51.051
    }
  },
  "meta": {
    "responseTime": 30
  }
}
```

**cURL Examples**:

```bash
# Get overall section leaders
curl http://localhost:3000/api/sections/leaders

# Get section leaders for Pro class
curl "http://localhost:3000/api/sections/leaders?class=Pro"
```

---


### Weather

#### GET /api/weather

Get weather data with optional time range filtering and pagination.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startTime` | string | No | Start timestamp (ISO format) |
| `endTime` | string | No | End timestamp (ISO format) |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Results per page (default: 100, max: 1000) |

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "timestamp": "2024-03-15T14:23:45.123Z",
      "air_temp": 25.5,
      "track_temp": 32.8,
      "humidity": 65.2,
      "pressure": 1013.25,
      "wind_speed": 12.5,
      "wind_direction": 180,
      "rain": 0
    }
  ],
  "meta": {
    "page": 1,
    "limit": 100,
    "total": 250,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false,
    "responseTime": 30
  }
}
```

**cURL Examples**:

```bash
# Get all weather data
curl http://localhost:3000/api/weather

# Get weather for time range
curl "http://localhost:3000/api/weather?startTime=2024-03-15T14:00:00.000Z&endTime=2024-03-15T15:00:00.000Z"
```

#### GET /api/weather/range

Get weather data for a specific time range (requires both start and end times).

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startTime` | string | Yes | Start timestamp (ISO format) |
| `endTime` | string | Yes | End timestamp (ISO format) |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Results per page (default: 100, max: 1000) |

**Response**: Same as GET /api/weather

**cURL Example**:

```bash
curl "http://localhost:3000/api/weather/range?startTime=2024-03-15T14:00:00.000Z&endTime=2024-03-15T15:00:00.000Z"
```


#### GET /api/weather/summary

Get aggregated weather statistics.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startTime` | string | No | Start timestamp (ISO format) |
| `endTime` | string | No | End timestamp (ISO format) |

**Response**:

```json
{
  "success": true,
  "data": {
    "avgAirTemp": 25.5,
    "minAirTemp": 22.3,
    "maxAirTemp": 28.7,
    "avgTrackTemp": 32.8,
    "minTrackTemp": 28.5,
    "maxTrackTemp": 36.2,
    "avgHumidity": 65.2,
    "avgPressure": 1013.25,
    "avgWindSpeed": 12.5,
    "totalRain": 0,
    "recordCount": 250
  },
  "meta": {
    "timeRange": {
      "start": "2024-03-15T14:00:00.000Z",
      "end": "2024-03-15T15:00:00.000Z"
    }
  }
}
```

**cURL Examples**:

```bash
# Get overall weather summary
curl http://localhost:3000/api/weather/summary

# Get summary for time range
curl "http://localhost:3000/api/weather/summary?startTime=2024-03-15T14:00:00.000Z&endTime=2024-03-15T15:00:00.000Z"
```

#### GET /api/weather/rain

Get rain periods (time ranges when rain occurred).

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `minRain` | float | No | Minimum rain value (default: 0) |

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "start": "2024-03-15T14:30:00.000Z",
      "end": "2024-03-15T14:45:00.000Z",
      "maxRain": 5.2,
      "avgRain": 3.1
    }
  ],
  "meta": {
    "total": 1,
    "minRain": 0,
    "responseTime": 20
  }
}
```

**cURL Example**:

```bash
curl "http://localhost:3000/api/weather/rain?minRain=1.0"
```

#### GET /api/weather/at-time

Get weather at a specific time (nearest measurement).

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `time` | string | Yes | Target timestamp (ISO format) |

**Response**: Single weather object

**cURL Example**:

```bash
curl "http://localhost:3000/api/weather/at-time?time=2024-03-15T14:30:00.000Z"
```

---


### Statistics

#### GET /api/statistics/overview

Get race-wide statistics.

**Parameters**: None

**Response**:

```json
{
  "success": true,
  "data": {
    "totalVehicles": 25,
    "totalLaps": 1125,
    "fastestLap": 148630,
    "fastestLapVehicle": "GR86-004-78",
    "avgLapTime": 152400,
    "maxSpeed": 185.3,
    "totalTelemetryRecords": 450000,
    "raceClasses": ["Pro", "Am"]
  },
  "meta": {
    "responseTime": 15
  }
}
```

**cURL Example**:

```bash
curl http://localhost:3000/api/statistics/overview
```

#### GET /api/statistics/vehicle/:vehicleId

Get pre-computed statistics for a specific vehicle.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | string | Yes | Vehicle ID |

**Response**:

```json
{
  "success": true,
  "data": {
    "vehicleId": "GR86-004-78",
    "carNumber": 78,
    "class": "Am",
    "fastestLap": 148630,
    "averageLap": 152400,
    "totalLaps": 45,
    "maxSpeed": 185.3,
    "position": 5,
    "lapTimeStdDev": 2345,
    "consistency": 0.985
  },
  "meta": {
    "responseTime": 10
  }
}
```

**cURL Example**:

```bash
curl http://localhost:3000/api/statistics/vehicle/GR86-004-78
```


#### GET /api/statistics/leaderboard

Get ranked vehicles by performance metric.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sortBy` | string | No | Sort field: `fastest_lap`, `average_lap`, `max_speed`, `position`, `total_laps` (default: `fastest_lap`) |
| `order` | string | No | Sort order: `asc`, `desc` (default: `asc`) |
| `class` | string | No | Filter by vehicle class |
| `limit` | integer | No | Maximum records (default: 50, max: 100) |

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "vehicleId": "GR86-004-78",
      "carNumber": 78,
      "class": "Am",
      "value": 148630,
      "fastestLap": 148630,
      "averageLap": 152400,
      "totalLaps": 45,
      "maxSpeed": 185.3,
      "position": 5
    }
  ],
  "meta": {
    "total": 25,
    "sortBy": "fastest_lap",
    "order": "asc",
    "class": null,
    "responseTime": 20
  }
}
```

**cURL Examples**:

```bash
# Get leaderboard by fastest lap
curl http://localhost:3000/api/statistics/leaderboard

# Get leaderboard by max speed
curl "http://localhost:3000/api/statistics/leaderboard?sortBy=max_speed&order=desc"

# Get Pro class leaderboard
curl "http://localhost:3000/api/statistics/leaderboard?class=Pro&limit=20"
```

---

## Query Parameters

### Common Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 1 | - | Page number for pagination |
| `limit` | integer | 100 | 1000 | Results per page |
| `sortBy` | string | varies | - | Field to sort by |
| `order` | string | asc | - | Sort order: `asc` or `desc` |

### Vehicle ID Format

Vehicle IDs must match the format: `GR86-XXX-YY`

Examples:
- `GR86-004-78`
- `GR86-004-46`
- `GR86-001-12`

### Timestamp Format

All timestamps must be in ISO 8601 format:

```
2024-03-15T14:23:45.123Z
```

---


## Examples

### Complete Workflow Example

```bash
# 1. Check API health
curl http://localhost:3000/api/health

# 2. Get all vehicles
curl http://localhost:3000/api/vehicles

# 3. Get specific vehicle details
curl http://localhost:3000/api/vehicles/GR86-004-78

# 4. Get lap times for that vehicle
curl "http://localhost:3000/api/lap-times/vehicle/GR86-004-78?limit=10"

# 5. Get telemetry for a specific lap
curl "http://localhost:3000/api/telemetry/vehicle/GR86-004-78/lap/10?limit=100"

# 6. Get telemetry statistics
curl http://localhost:3000/api/telemetry/vehicle/GR86-004-78/stats

# 7. Get section times
curl http://localhost:3000/api/sections/vehicle/GR86-004-78/lap/10

# 8. Get race results
curl http://localhost:3000/api/results/vehicle/GR86-004-78

# 9. Get weather data
curl http://localhost:3000/api/weather/summary

# 10. Get leaderboard
curl http://localhost:3000/api/statistics/leaderboard
```

### JavaScript Fetch Example

```javascript
// Get vehicle details
async function getVehicle(vehicleId) {
  try {
    const response = await fetch(`http://localhost:3000/api/vehicles/${vehicleId}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('Vehicle:', data.data);
      return data.data;
    } else {
      console.error('Error:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}

// Get telemetry with pagination
async function getTelemetry(vehicleId, lap, page = 1) {
  const url = new URL('http://localhost:3000/api/telemetry');
  url.searchParams.append('vehicleId', vehicleId);
  url.searchParams.append('lap', lap);
  url.searchParams.append('page', page);
  url.searchParams.append('limit', 500);
  
  const response = await fetch(url);
  const data = await response.json();
  
  return data;
}

// Usage
const vehicle = await getVehicle('GR86-004-78');
const telemetry = await getTelemetry('GR86-004-78', 10, 1);
```


### Python Requests Example

```python
import requests

BASE_URL = "http://localhost:3000/api"

# Get vehicle details
def get_vehicle(vehicle_id):
    response = requests.get(f"{BASE_URL}/vehicles/{vehicle_id}")
    data = response.json()
    
    if data['success']:
        return data['data']
    else:
        print(f"Error: {data['error']['message']}")
        return None

# Get telemetry data
def get_telemetry(vehicle_id, lap=None, page=1, limit=100):
    params = {
        'vehicleId': vehicle_id,
        'page': page,
        'limit': limit
    }
    
    if lap:
        params['lap'] = lap
    
    response = requests.get(f"{BASE_URL}/telemetry", params=params)
    return response.json()

# Get fastest laps
def get_fastest_laps(limit=10, vehicle_class=None):
    params = {'limit': limit}
    
    if vehicle_class:
        params['class'] = vehicle_class
    
    response = requests.get(f"{BASE_URL}/lap-times/fastest", params=params)
    return response.json()

# Usage
vehicle = get_vehicle('GR86-004-78')
print(f"Vehicle: {vehicle['vehicleId']}, Class: {vehicle['class']}")

telemetry = get_telemetry('GR86-004-78', lap=10, limit=500)
print(f"Telemetry records: {len(telemetry['data'])}")

fastest = get_fastest_laps(limit=20, vehicle_class='Pro')
print(f"Fastest laps: {len(fastest['data'])}")
```

### Error Handling Example

```javascript
async function fetchWithErrorHandling(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      // Handle API error
      switch (data.error.code) {
        case 'VEHICLE_NOT_FOUND':
          console.error('Vehicle not found:', data.error.details.vehicleId);
          break;
        case 'INVALID_PAGINATION':
          console.error('Invalid pagination parameters');
          break;
        case 'DATABASE_ERROR':
          console.error('Database error occurred');
          break;
        default:
          console.error('API error:', data.error.message);
      }
      return null;
    }
    
    return data.data;
  } catch (error) {
    // Handle network error
    console.error('Network error:', error);
    return null;
  }
}

// Usage
const vehicle = await fetchWithErrorHandling('http://localhost:3000/api/vehicles/GR86-004-99');
if (vehicle) {
  console.log('Vehicle found:', vehicle);
} else {
  console.log('Failed to fetch vehicle');
}
```

---


## Postman Collection

A complete Postman collection is available in the `Racing_Data_API.postman_collection.json` file.

### Importing the Collection

1. Open Postman
2. Click "Import" button
3. Select the `Racing_Data_API.postman_collection.json` file
4. The collection will be imported with all endpoints and examples

### Collection Variables

The collection includes the following variables that you can customize:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `http://localhost:3000/api` | API base URL |
| `vehicleId` | `GR86-004-78` | Sample vehicle ID for testing |
| `carNumber` | `78` | Sample car number for testing |
| `lap` | `10` | Sample lap number for testing |

### Editing Variables

1. Click on the collection name
2. Go to the "Variables" tab
3. Update the "Current Value" column
4. Save changes

### Collection Structure

The collection is organized into folders matching the API structure:

- **Health** - Health check endpoint
- **Vehicles** - Vehicle endpoints (5 requests)
- **Telemetry** - Telemetry endpoints (7 requests)
- **Lap Times** - Lap time endpoints (6 requests)
- **Race Results** - Race result endpoints (4 requests)
- **Section Times** - Section time endpoints (5 requests)
- **Weather** - Weather endpoints (5 requests)
- **Statistics** - Statistics endpoints (4 requests)

**Total**: 37 pre-configured API requests

---

## Performance Tips

### Caching

- Frequently accessed data (vehicles, results, statistics) is cached automatically
- Cache hit responses are typically < 10ms
- Cache TTL varies by endpoint (5-30 minutes)
- Check the `meta.cached` field to see if response was cached

### Pagination

- Use appropriate `limit` values to balance performance and data needs
- Default limit is 100, maximum is 1000
- For large datasets, use pagination instead of requesting all data at once
- Monitor `meta.totalPages` to implement proper pagination UI

### Query Optimization

- Filter data at the API level rather than client-side
- Use specific endpoints (e.g., `/api/telemetry/vehicle/:id/lap/:lap`) instead of filtering results
- Request only needed telemetry types using `telemetryNames` parameter
- Use aggregated statistics endpoints instead of calculating on client

### Streaming

- Use SSE streaming (`/api/telemetry/stream/:vehicleId`) for real-time race replay
- Adjust `playbackSpeed` parameter for faster/slower replay
- Streaming reduces memory usage compared to loading all data at once

---

## Support and Feedback

For issues, questions, or feature requests, please refer to the main README.md file.

---

**Last Updated**: 2024-03-15

**API Version**: 1.0.0
