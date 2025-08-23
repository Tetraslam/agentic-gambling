// Jest setup file for global test configuration

// Set up environment variables for testing
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Set up global test timeout
jest.setTimeout(10000);

// Mock fetch for browser compatibility tests (if needed)
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

// Set up any global mocks or utilities here
global.mockConsoleLog = () => {
  const originalLog = console.log;
  console.log = jest.fn();
  return () => {
    console.log = originalLog;
  };
};

// Add custom matchers (if needed)
// expect.extend({
//   toBeValidPolymarketPrice(received) {
//     const pass = typeof received === 'number' && received >= 0 && received <= 1;
//     if (pass) {
//       return {
//         message: () => `expected ${received} not to be a valid Polymarket price`,
//         pass: true,
//       };
//     } else {
//       return {
//         message: () => `expected ${received} to be a valid Polymarket price (0-1)`,
//         pass: false,
//       };
//     }
//   },
// });
