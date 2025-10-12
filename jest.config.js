export default {
  testEnvironment: "node",
  transform: {}, // No transform needed for ESM
  testMatch: ["**/test/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.{js,mjs}", "!src/runtime/**"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  verbose: true,
};
