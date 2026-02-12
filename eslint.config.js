import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["./*", "../*"],
              message: "Use @/ path alias instead of relative imports.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [".output/", ".wxt/", "node_modules/"],
  },
);
