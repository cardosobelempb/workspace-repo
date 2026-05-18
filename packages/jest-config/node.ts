import type { Config } from "jest";

type NodeOptions = {
  tsconfig: string;
  roots: string[];
  setupFilesAfterEnv?: string[];
  moduleNameMapper?: Record<string, string>;
};

export function createNodeConfig(options: NodeOptions): Config {
  return {
    testEnvironment: "node",
    roots: options.roots,
    testMatch: ["**/*.spec.ts", "**/*.test.ts"],
    setupFilesAfterEnv: options.setupFilesAfterEnv ?? [],
    moduleNameMapper: options.moduleNameMapper,
    transform: {
      "^.+\\.tsx?$": [
        "ts-jest",
        {
          tsconfig: options.tsconfig,
        },
      ],
    },
    clearMocks: true,
  };
}
