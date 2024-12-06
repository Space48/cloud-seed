import typescriptPlugin from "typescript-eslint";
import nodePlugin from "eslint-plugin-n";
import prettierRecommendedConfig from "eslint-plugin-prettier/recommended";

export default typescriptPlugin.config(
  {
    ignores: ["dist/", "scripts/", ".gen/"],
  },
  nodePlugin.configs["flat/recommended"],
  ...typescriptPlugin.configs.recommended,
  prettierRecommendedConfig,
  {
    settings: {
      n: {
        tryExtensions: [".js", "/index.js", ".ts", "/index.ts"],
      },
    },
    rules: {
      "prefer-const": "error",
      "n/hashbang": "off",
      "n/no-process-exit": "off",
      "n/no-unsupported-features/es-builtins": "error",
      "n/no-unsupported-features/es-syntax": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-inferrable-types": [
        "warn",
        {
          ignoreParameters: true,
        },
      ],
      "@typescript-eslint/no-unused-vars": "warn",
      "prettier/prettier": "warn",
    },
  },
);
