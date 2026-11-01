// Arranca la app en modo real contra el Supabase simulado: npm run dev:live
import { spawn } from "node:child_process";

const mockPort = process.argv[3] || "54399";
const appPort = process.argv[2] || "3200";
const cwd = new URL("..", import.meta.url);
const children = [
  spawn(process.execPath, ["tests/mock-supabase.mjs", mockPort], { cwd, stdio: "inherit" }),
  spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", appPort], {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: `http://localhost:${mockPort}`,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "clave-de-prueba",
      ANTHROPIC_API_KEY: "clave-de-prueba",
      ANTHROPIC_BASE_URL: `http://localhost:${mockPort}`,
    },
  }),
];
const stop = () => children.forEach((c) => c.kill());
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
process.on("exit", stop);
