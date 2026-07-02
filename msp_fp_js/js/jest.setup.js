/**
 * Jest setup file to ensure the Rust module is available before tests run
 */

const path = require('path');
const fs = require('fs');

beforeAll(async () => {
  // Check if the native module exists
  const modulePath = path.join(__dirname, '../rs/target/release/fp_js.node');
  
  if (!fs.existsSync(modulePath)) {
    throw new Error(
      `Native module not found at ${modulePath}. ` +
      'Please run "npm run build" before running tests.'
    );
  }
  
  // Try to load the module to ensure it's valid
  try {
    const fp = require('./index.js');
    
    // Basic smoke test
    const testResult = fp.createFixedDecimal('1.00', 2);
    if (testResult !== '1.00') {
      throw new Error('Native module loaded but basic functionality test failed');
    }
    
    console.log('✓ Native module loaded successfully');
  } catch (error) {
    throw new Error(`Failed to load native module: ${error.message}`);
  }
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
