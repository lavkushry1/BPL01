/** @type {import('ts-jest').JestConfigWithTsJest} */
const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/unit-setup.ts'],
  testMatch: [
    '**/__tests__/unit/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/repositories/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  displayName: 'unit',
};
