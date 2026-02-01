/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress"],
  testRunner: "vitest",
  checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",
  vitest: {
    configFile: "vitest.config.ts",
  },
  mutate: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/index.ts", // Entry point
  ],
  coverageAnalysis: "perTest",
  timeoutMS: 60000,
  concurrency: 2,
};

export default config;
