import baseConfig from "./base.mjs";

export default [
  ...baseConfig,
  {
    rules: {
      "react/react-in-jsx-scope": "off",
    },
  },
];
