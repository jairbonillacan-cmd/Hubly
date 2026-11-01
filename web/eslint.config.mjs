import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true }],
      // Tras iniciar o cerrar sesión se recarga a propósito, para no heredar el estado anterior.
      "@next/next/no-location-assign-relative-destination": "off",
    },
  },
  { ignores: [".next/**", "e2e/.salida/**", "next-env.d.ts"] },
];

export default config;
