/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
export default {
  plugins: ["prettier-plugin-tailwindcss", "@ianvs/prettier-plugin-sort-imports"],
  tabWidth: 2,
  printWidth: 100,
  bracketSpacing: true,
  arrowParens: "avoid",
  importOrder: ["<THIRD_PARTY_MODULES>", "^@/(.*)$", "^[./]", "<TYPES>"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  importOrderTypeScriptVersion: "5.0.0",
};
