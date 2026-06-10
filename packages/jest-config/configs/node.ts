import type { Config } from "jest";

type NodeOptions = {
  tsconfig: string;
  roots?: string[];
  setupFilesAfterEnv?: string[];
  moduleNameMapper?: Record<string, string>;
  collectCoverage?: boolean;
  collectCoverageFrom?: string[];
  coverageDirectory?: string;
};

export function createNodeConfig(options: NodeOptions): Config {
  return {
    testEnvironment: "node",

    roots: options.roots ?? ["<rootDir>/src"],

    testMatch: ["**/*.spec.ts", "**/*.test.ts"],

    setupFilesAfterEnv: options.setupFilesAfterEnv ?? [],

    moduleNameMapper: {
      "^@repo/jest-config$": "<rootDir>/../../packages/jest-config/index.ts",
      "^@repo/jest-config/(node|next|expo)$":
        "<rootDir>/../../packages/jest-config/configs/$1.ts",
      "^@repo/jest-config/helpers$":
        "<rootDir>/../../packages/jest-config/helpers/index.ts",
      "^@repo/jest-config/helpers/(.*)$":
        "<rootDir>/../../packages/jest-config/helpers/$1",
      "^@repo/([^/]+)$": "<rootDir>/../../packages/$1/src/index.ts",
      "^@repo/([^/]+)/(.*)$": "<rootDir>/../../packages/$1/src/$2",
      "^@/(.*)$": "<rootDir>/src/$1",
      ...options.moduleNameMapper,
    },

    transform: {
      "^.+\\.tsx?$": [
        "ts-jest",
        {
          tsconfig: options.tsconfig,
        },
      ],
    },

    collectCoverage: options.collectCoverage ?? false,

    coverageDirectory: options.coverageDirectory ?? "<rootDir>/coverage",

    collectCoverageFrom: options.collectCoverageFrom ?? [
      "src/**/*.ts",
      "!src/**/*.spec.ts",
      "!src/**/*.test.ts",
      "!src/**/index.ts",
      "!src/**/*.module.ts",
      "!src/**/main.ts",
      "!src/**/*.dto.ts",
      "!src/**/*.types.ts",
      "!src/**/*.interface.ts",
    ],

    coverageThreshold: {
      global: {
        branches: 80,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },

    clearMocks: true,
    resetMocks: false,
    restoreMocks: true,
  };
}
