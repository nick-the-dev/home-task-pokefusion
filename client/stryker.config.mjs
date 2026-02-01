/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress"],
  testRunner: "vitest",
  checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",
  vitest: {
    configFile: "vite.config.ts",
  },
  mutate: [
    "src/components/BattleVerdict.tsx",
    "src/components/ChildCard.tsx",
    // Focus on the tested components
  ],
  coverageAnalysis: "perTest",
  timeoutMS: 60000,
  concurrency: 2,
};

export default config;
