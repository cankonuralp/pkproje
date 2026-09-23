// Statik çözümleme (EKSIKLER 2): Next.js'in önerdiği kurallar + TypeScript kuralları.
// docs/ (maket ve sunum, tarayıcıda koşan düz betik) ve tools/ (maket ölçüm araçları) uygulama kodu değildir.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-undef": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "site/**", "next-env.d.ts", "docs/**", "tools/**", "data/**"]),
]);
