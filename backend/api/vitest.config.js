import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Global test timeout (10 seconds)
    testTimeout: 10000,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.js',
        'import-data.js'
      ]
    },
    
    // Include test files
    include: ['tests/**/*.test.js'],
    
    // Globals (optional - allows using describe, it, expect without imports)
    globals: true,
    
    // Setup files (if needed)
    // setupFiles: ['./tests/setup.js'],
    
    // Reporter
    reporter: 'verbose',
    
    // Parallel execution
    threads: true,
    
    // Isolate tests
    isolate: true
  }
});
