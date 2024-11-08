import eslint from "@eslint/js";
import jest from "eslint-plugin-jest";
import node from "eslint-plugin-n";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["coverage/**", "dist/**", "eslint.config.mjs", "jest.config.cjs"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  prettierRecommended,
  {
    files: ["index.mts", "src/**/*.mts", "test/**/*.mts"],
    languageOptions: {
      ecmaVersion: 13,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      sourceType: "commonjs",
    },

    plugins: {
      n: node,
    },

    rules: {
      indent: ["error", 2, { SwitchCase: 1 }],
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "double", { avoidEscape: true }],
      semi: ["error", "always"],
      "no-unused-vars": "off", // Handled by TypeScript

      "prettier/prettier": "error",

      "n/no-extraneous-import": ["error", { allowModules: ["@jest/globals"] }],
      "n/no-missing-import": ["error"],
      "n/no-unsupported-features/es-syntax": ["error", {}],

      "@typescript-eslint/dot-notation": ["off"],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
        },
      ],
    },

    settings: {
      n: {
        tryExtensions: [".ts", ".mts", ".mjs"],
      },
    },
  },
  {
    files: ["test/**/*"],

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsConfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      jest,
    },

    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
);
