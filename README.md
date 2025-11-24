# Toyota GR Cup Series Racing Data Analysis

A system for analyzing Toyota GR Cup Series race data with two main components: a backend data processing tool and a frontend web dashboard.

## Overview

This project processes CSV files containing racing data (lap times, telemetry, race results, weather, and track sections) and provides tools for analysis and visualization.

The system consists of:

- **Backend**: Node.js command-line tools for data processing and report generation
- **Frontend**: Vue.js web application for data visualization and dashboard interface

## Setup

### 1. Download Racing Data

Before using this system, you need to download the Circuit of the Americas racing data:

1. Go to https://trddev.com/hackathon-2025/
2. Download `circuit-of-the-americas.zip`
3. Extract all CSV files to the `backend/` directory of this project

The extracted CSV files should be placed directly in the `Toyota-GR/backend/` directory alongside the JavaScript files and other backend components.

### 2. Quick Start

### Backend (Data Processing)

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Run the complete analysis pipeline:

```bash
npm run explore:all-streaming
```

This will process all CSV data files and generate markdown reports.

### Frontend (Web Dashboard)

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

The web application will be available at `http://localhost:5173`.

Note: The frontend requires the backend API to be running. See the frontend documentation for API setup instructions.

## Requirements

- Node.js v18 or higher
- Racing data CSV files from https://trddev.com/hackathon-2025/ (circuit-of-the-americas.zip)

## Documentation

For detailed information about each component:

- [Backend Documentation](https://github.com/malawadd/Toyota-GR/tree/main/backend) - Complete guide for data processing, analysis tools, and API usage
- [Frontend Documentation](https://github.com/malawadd/Toyota-GR/tree/main/frontend) - Web dashboard setup, configuration, and usage

## Data Processing Features

- Lap time analysis and vehicle performance comparisons
- Race results processing with position and gap analysis
- Telemetry data analysis (speed, throttle, brake, RPM)
- Weather condition monitoring
- Track section performance breakdown
- Vehicle-specific data queries
- Automated report generation in markdown format

## Web Dashboard Features

- Interactive data visualizations
- Real-time and historical telemetry display
- Lap time comparisons and analysis
- Race leaderboards and results
- Weather condition tracking
- Driver performance insights

