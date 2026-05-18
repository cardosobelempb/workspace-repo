import { createNodeConfig } from "@repo/jest-config/node";

export default createNodeConfig({
  tsconfig: "<rootDir>/tsconfig.test.json",
  roots: ["<rootDir>/src", "<rootDir>/test"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@repo/common$": "<rootDir>/../../packages/common/src/index.ts",
    "^@repo/common/(.*)$": "<rootDir>/../../packages/common/src/$1",
  },
});
