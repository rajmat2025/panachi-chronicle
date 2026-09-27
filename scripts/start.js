/**
 * Production start (Hostinger Node.js hosting and local `npm start`).
 * Starts Next.js on PORT (default 3100). The chronicle is read-only, so unlike
 * the tree app there are no database migrations here.
 */
const { spawn } = require("node:child_process");

const port = process.env.PORT || "3100";
const nextBin = require.resolve("next/dist/bin/next");

console.log(`Starting Panachickal Chronicle on port ${port}…`);
const child = spawn(process.execPath, [nextBin, "start", "-p", port], { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 0));
