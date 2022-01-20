module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jest/recommended",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
  },
  plugins: ["@typescript-eslint", "node", "prettier", "jest"],
  rules: {
    indent: ["error", 2, { SwitchCase: 1 }],
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "double", { avoidEscape: true }],
    semi: ["error", "always"],
    "@typescript-eslint/quotes": ["warn", "double", { allowTemplateLiterals: true, avoidEscape: true }],
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "prettier/prettier": "error",
    "node/no-unsupported-features/es-syntax": ["error", { ignores: ["modules"] }],
    "node/no-missing-import": [
      "error",
      {
        allowModules: [],
        tryExtensions: [".js", ".json", ".node", ".ts"],
      },
    ],
  },
  settings: {
    node: {
      tryExtensions: [".ts"],
    },
  },
  overrides: [
    {
      files: ["test/**/*"],
      env: { jest: true },
    },
  ],
  ignorePatterns: ["dist"],
};
