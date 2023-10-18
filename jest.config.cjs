module.exports = {
  collectCoverageFrom: ["src/**/*.ts", "src/**/*.mts"],
  coverageReporters: ["lcov", "html", "text"],
  extensionsToTreatAsEsm: [".mts"],
  moduleFileExtensions: ["js", "ts", "mts", "mjs"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  preset: "ts-jest/presets/default-esm",
  resolver: "<rootDir>/test/fixture/JestMjsResolver.cjs",
  testEnvironment: "node",
  testMatch: null,
  testRegex: "test/.*\\.test.m?ts$",
  transform: {
    "^.+\\.m?[t]s?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
};
