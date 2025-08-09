/* eslint-disable no-undef */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@shared/(.*)$': '<rootDir>/src/modules/shared/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/server.ts',
    '!src/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70, // Reduced due to integration test mocking
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testTimeout: 30000, // Increased timeout for integration tests
  // Separate unit and integration tests
  projects: [
    {
      preset: 'ts-jest',
      testEnvironment: 'node',
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/use-cases/__tests__/**/*.test.ts', '<rootDir>/src/__tests__/server.test.ts'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@modules/(.*)$': '<rootDir>/src/modules/$1',
        '^@shared/(.*)$': '<rootDir>/src/modules/shared/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
      testTimeout: 10000
    },
    {
      preset: 'ts-jest',
      testEnvironment: 'node',
      displayName: 'integration',
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.ts'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@modules/(.*)$': '<rootDir>/src/modules/$1',
        '^@shared/(.*)$': '<rootDir>/src/modules/shared/$1',
      },
      testTimeout: 30000
    }
  ]
};
