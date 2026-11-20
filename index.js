import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Compatibility entry point for hosts that run `node index.js`.
// The real application lives in src/ and is compiled to dist/ by TypeScript.
const rootDir = fileURLToPath(new URL(".", import.meta.url));
const serverUrl = new URL("./dist/server.js", import.meta.url);

if (!existsSync(fileURLToPath(serverUrl))) {
  console.log("Build output not found — building the server first...");
  execSync("npm run build", { stdio: "inherit", cwd: rootDir });
}

await import(serverUrl.href);
