import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    // Deuda heredada (C-05 en docs/ROADMAP.md): avisos con tope en package.json, que solo puede bajar.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
  { ignores: [".next/**", "e2e/.salida/**", "next-env.d.ts"] },
];

export default config;
