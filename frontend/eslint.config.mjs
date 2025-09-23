// Flat ESLint config for Next.js + TypeScript
// Uses FlatCompat to reuse the legacy "eslint-config-next" presets

import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import eslintPluginUnusedImports from "eslint-plugin-unused-imports";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  // Globally ignore generated/build artifacts
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
    ],
  },

  // Base JS recommended
  js.configs.recommended,

  // Next.js presets via compat
  ...compat.extends("next/core-web-vitals"),
  ...compat.extends("next/typescript"),

  // Our custom rules/plugins
  {
    plugins: {
      "unused-imports": eslintPluginUnusedImports,
    },
    rules: {
      // Rely on plugin to handle unused imports/vars. Next config brings TS plugin already.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // Keep code moving: treat broad any usage and a few noisy rules as warnings
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
      "no-empty": "warn",
      "@typescript-eslint/triple-slash-reference": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" }
      ],
    },
  },
];
