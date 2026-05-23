const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/Badge.tsx',
    'components/StatCard.tsx',
    'components/ProgressBar.tsx',
    'components/Card.tsx',
    'lib/api.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 70,
    },
  },
};

module.exports = createJestConfig(config);
