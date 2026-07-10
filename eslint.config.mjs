import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Legacy screens are incrementally typed; keep visibility without blocking CI.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["mobile-app/**/*.{ts,tsx,js}", "vendor-app/**/*.{ts,tsx,js}", "delivery-app/**/*.{ts,tsx,js}"],
    rules: {
      "@typescript-eslint/no-require-imports": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "prefer-const": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
