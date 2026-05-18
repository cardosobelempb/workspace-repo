import { createNodeConfig } from "@repo/jest-config/node";

export default createNodeConfig({
  tsconfig: "<rootDir>/tsconfig.json",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "^@/common$": "<rootDir>/src/index.ts",
    "^@/common/(.*)$": "<rootDir>/src/$1",
  },
});
