import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!src/__tests__/**'],
  // Doc reporter will be added in Task 8:
  // reporters: ['default', '<rootDir>/src/__tests__/reporters/doc-reporter.ts'],
};

export default config;
