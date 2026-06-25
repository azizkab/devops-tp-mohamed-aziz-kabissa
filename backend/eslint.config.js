const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    ignores: ["node_modules/", "exports/", "uploads/"],
    rules: {
      "no-console": "off",
      "no-unused-vars": "warn",
    },
  },
];
