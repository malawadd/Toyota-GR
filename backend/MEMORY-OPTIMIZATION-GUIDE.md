# Memory Optimization Guide

## Problem
The telemetry CSV file is very large (>50MB) and causes Node.js to run out of heap memory with the default settings.

## Solutions

### Solution 1: Increase Node.js Memory (Quick Fix)
Run the script with increased heap memory allocation:

```bash
# Use 8GB of memory
npm run explore:all

# Use 16GB of memory (if 8GB isn't enough)
npm run explore:all-large
```

**Pros:**
- Quick and easy
- No code changes needed

**Cons:**
- Requires sufficient RAM on your machine
- Still loads all data into memory

### Solution 2: True Streaming (Recommended)
Use the memory-efficient streaming version:

```bash
npm run explore:all-streaming
```

This version processes telemetry data in chunks without loading everything into memory at once.

**Pros:**
- Works with limited RAM
- Processes data incrementally
- More scalable for even larger files

**Cons:**
- Slightly different implementation

## Running Online

To run this analysis online, you have several options:

### Option 1: GitHub Codespaces
1. Push your code to GitHub
2. Open in Codespaces (free tier available)
3. Run: `npm install && npm run explore:all-streaming`

### Option 2: Google Colab (with Node.js)
1. Upload your CSV files to Google Drive
2. Create a Colab notebook
3. Install Node.js in the notebook:
```python
!curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
!apt-get install -y nodejs
```
4. Clone your repo and run the analysis

### Option 3: Replit
1. Create a new Node.js Repl
2. Upload your files
3. Run: `npm install && npm run explore:all-streaming`

### Option 4: Cloud VM (AWS/GCP/Azure)
1. Spin up a small VM instance
2. Install Node.js
3. Upload files and run analysis
4. Download generated reports

## Recommended Approach

For your use case, I recommend:

1. **Locally**: Use `npm run explore:all-streaming` - it's designed to handle large files efficiently
2. **Online**: Use GitHub Codespaces or Replit for free cloud execution

## File Size Reference
- Telemetry file: ~50MB+ (triggers streaming mode)
- Other CSV files: <50MB (loaded into memory normally)

## Memory Usage Comparison

| Method | Memory Usage | Speed | Scalability |
|--------|--------------|-------|-------------|
| Default | ~4GB+ | Fast | Limited |
| Increased Heap | 8-16GB | Fast | Medium |
| Streaming | ~500MB | Medium | Excellent |
