import type { Config } from "jest";

type NextOptions = {
  tsconfig?: string;
  roots?: string[];
  setupFilesAfterEnv?: string[];
  moduleNameMapper?: Record<string, string>;
  testMatch?: string[];
};

export function createNextConfig(options: NextOptions = {}): Config {
  return {
    testEnvironment: "jsdom",
    roots: options.roots,
    testMatch: options.testMatch ?? [
      "**/*.spec.tsx",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.test.ts",
    ],
    setupFilesAfterEnv: options.setupFilesAfterEnv ?? [],
    moduleNameMapper: options.moduleNameMapper,
    transform: {
      "^.+\\.tsx?$": [
        "ts-jest",
        {
          tsconfig: options.tsconfig ?? "<rootDir>/tsconfig.json",
        },
      ],
    },
    clearMocks: true,
  };
}
