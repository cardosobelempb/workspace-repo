import baseConfig from "@repo/eslint-config/base";

export default [
  ...baseConfig,
  {
    files: ["src/domain/**/*.ts", "src/application/**/*.ts", "src/index.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-duplicate-enum-values": "off",
      "no-useless-escape": "off",
    },
  },
];
