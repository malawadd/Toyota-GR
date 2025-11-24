# Racing Telemetry Dashboard

A web application for viewing and analyzing Toyota GR Cup Series race data. This dashboard provides access to vehicle telemetry, lap times, race results, and driver performance analysis.

## What This Does

This application connects to a racing data API and displays:

- Real-time and historical telemetry data (speed, throttle, brake, RPM, steering)
- Lap time analysis and comparisons
- Vehicle performance statistics
- Race leaderboards and results
- Weather conditions during races
- Section times for track segments
- AI-powered driver training insights
- Post-event race analysis

## Requirements

- Node.js v18 or higher
- A running instance of the racing data API (see API_DOCUMENTATION.md)

## Installation

Install dependencies:

```bash
npm install
```

## Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

## Building for Production

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## API Configuration

The application expects the racing data API to be running at `http://localhost:3000/api`. If your API is running on a different host or port, you will need to update the API service configuration in the source code.

## Project Structure

- `src/views/` - Main dashboard pages
- `src/components/` - Reusable UI components
- `src/stores/` - State management (Pinia stores)
- `src/services/` - API communication layer
- `src/router/` - Application routing

## Technology Stack

- Vue 3 with Composition API
- Vue Router for navigation
- Pinia for state management
- D3.js for data visualization
- Three.js for 3D graphics
- Vite as build tool

## Additional Documentation

- `API_DOCUMENTATION.md` - Complete API reference
- `Racing_Data_API.postman_collection.json` - Postman collection for API testing
