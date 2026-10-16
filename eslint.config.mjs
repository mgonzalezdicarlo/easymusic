import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^\\u0000"], // side-effect imports (e.g. global CSS)
            ["^node:"], // Node built-ins
            ["^@?\\w"], // external packages
            ["^@/"], // project alias
            ["^\\."], // relative imports
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
  prettier, // must stay last so formatting rules never conflict with Prettier
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "blob-report/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
