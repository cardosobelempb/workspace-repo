import type { Config } from "jest";

type ExpoOptions = {
  roots?: string[];
  setupFilesAfterEnv?: string[];
  moduleNameMapper?: Record<string, string>;
  testMatch?: string[];
};

export function createExpoConfig(options: ExpoOptions = {}): Config {
  return {
    preset: "jest-expo",
    roots: options.roots,
    testMatch: options.testMatch ?? [
      "**/*.spec.tsx",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.test.ts",
    ],
    setupFilesAfterEnv: options.setupFilesAfterEnv ?? [],
    moduleNameMapper: options.moduleNameMapper,
    clearMocks: true,
  };
}
