import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";
import baseConfig from "./base.mjs";

export default defineConfig([
  ...baseConfig,
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "next-env.d.ts"]),
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);
