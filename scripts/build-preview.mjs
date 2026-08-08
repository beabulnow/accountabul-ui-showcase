import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// Lovable's production build targets Cloudflare. Local preview needs Nitro's
// Node server preset so `.output/server/index.mjs` can listen on a local port.
const viteCli = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
const build = spawn(process.execPath, [viteCli, "build"], {
  env: { ...process.env, NITRO_PRESET: "node-server" },
  stdio: "inherit",
});

const exitCode = await new Promise((resolve, reject) => {
  build.once("error", reject);
  build.once("exit", (code, signal) => {
    if (signal) reject(new Error(`Vite build stopped by ${signal}`));
    else resolve(code ?? 1);
  });
});

if (exitCode !== 0) process.exit(exitCode);
