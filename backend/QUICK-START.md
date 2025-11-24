# Quick Start Guide

## Your Problem
You're getting "JavaScript heap out of memory" errors when running `explore-all.js` because the telemetry file has over 17 million records.

## The Solution

I've created **two solutions** for you:

### ✅ Solution 1: Memory-Efficient Streaming (RECOMMENDED)

Run this command:
```bash
npm run explore:all-streaming
```

This uses a new `explore-all-streaming.js` file that processes telemetry data in chunks without loading everything into memory. It successfully processed 17.6+ million records in testing!

**Pros:**
- Works on any PC with limited RAM
- No configuration needed
- Scalable to even larger files

### Solution 2: Increase Node Memory

If you prefer the original script, run:
```bash
npm run explore:all          # Uses 8GB RAM
npm run explore:all-large    # Uses 16GB RAM (if needed)
```

**Pros:**
- Uses original code
- Slightly faster

**Cons:**
- Requires sufficient RAM on your machine

## Running Online

Want to run this in the cloud? Check out:
- **[ONLINE-DEPLOYMENT.md](./ONLINE-DEPLOYMENT.md)** - Step-by-step guides for:
  - GitHub Codespaces (free tier)
  - Replit (easiest)
  - Google Colab (free, powerful)
  - Cloud VMs (AWS/GCP/Azure)

## More Details

- **[MEMORY-OPTIMIZATION-GUIDE.md](./MEMORY-OPTIMIZATION-GUIDE.md)** - Technical details about the memory issue and solutions
- **[README.md](./README.md)** - Full project documentation

## What Changed?

I've added:
1. ✅ `explore-all-streaming.js` - Memory-efficient version
2. ✅ New npm scripts in `package.json`
3. ✅ Documentation guides
4. ✅ Updated README with memory optimization info

## Next Steps

1. Try the streaming version: `npm run explore:all-streaming`
2. If you want to run online, see [ONLINE-DEPLOYMENT.md](./ONLINE-DEPLOYMENT.md)
3. All generated reports will be saved as `.md` files in your directory
