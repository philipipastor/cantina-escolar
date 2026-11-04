import type { Config } from "jest"

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFiles: ["<rootDir>/tests/setup-env.ts"],
  globalSetup: "<rootDir>/tests/global-setup.ts",
  testTimeout: 20000,
  clearMocks: true,
}

export default config
