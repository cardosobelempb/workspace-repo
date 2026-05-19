import type { Config } from "jest";

const config: Config = {
  projects: [
    "<rootDir>/packages/common/jest.config.ts",
    "<rootDir>/apps/backend/jest.config.ts",
    "<rootDir>/apps/frontend/jest.config.ts",
  ],
};

export default config;
