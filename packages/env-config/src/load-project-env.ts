import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse, resolve } from "node:path";

import { parse as parseDotenv } from "dotenv";

export type LoadProjectEnvOptions = {
  cwd?: string;
  mode?: string;
  envDir?: string;
};

let loaded = false;

function findProjectRoot(cwd: string): string {
  let currentDir = resolve(cwd);
  const rootDir = parse(currentDir).root;

  while (currentDir !== rootDir) {
    const packageJsonPath = join(currentDir, "package.json");

    if (existsSync(packageJsonPath)) {
      const packageJson = readFileSync(packageJsonPath, "utf8");

      if (packageJson.includes('"workspaces"')) {
        return currentDir;
      }
    }

    currentDir = dirname(currentDir);
  }

  return resolve(cwd);
}

export function loadProjectEnv(options: LoadProjectEnvOptions = {}): void {
  if (loaded) {
    return;
  }

  const mode = options.mode ?? process.env.NODE_ENV ?? "development";
  const envDir = options.envDir ?? findProjectRoot(options.cwd ?? process.cwd());
  const envFileNames = [
    ".env",
    ".env.local",
    `.env.${mode}`,
    `.env.${mode}.local`,
  ];
  const loadedEnv: NodeJS.ProcessEnv = {};

  for (const fileName of envFileNames) {
    const filePath = join(envDir, fileName);

    if (!existsSync(filePath)) {
      continue;
    }

    Object.assign(loadedEnv, parseDotenv(readFileSync(filePath)));
  }

  for (const [key, value] of Object.entries(loadedEnv)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  loaded = true;
}
