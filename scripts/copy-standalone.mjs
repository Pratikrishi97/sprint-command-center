// Cross-platform replacement for:
//   cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
// Node's fs.cpSync works identically on Windows / macOS / Linux.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const standaloneDir = resolve(root, ".next/standalone");

if (!existsSync(standaloneDir)) {
  console.error(
    `[copy-standalone] .next/standalone not found. Run "next build" first.`
  );
  process.exit(1);
}

// .next/static -> .next/standalone/.next/static
const staticSrc = resolve(root, ".next/static");
const staticDest = resolve(standaloneDir, ".next/static");
if (existsSync(staticSrc)) {
  mkdirSync(dirname(staticDest), { recursive: true });
  cpSync(staticSrc, staticDest, { recursive: true });
  console.log(`[copy-standalone] copied .next/static -> .next/standalone/.next/static`);
} else {
  console.warn(`[copy-standalone] warning: .next/static not found, skipping`);
}

// public -> .next/standalone/public
const publicSrc = resolve(root, "public");
const publicDest = resolve(standaloneDir, "public");
if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDest, { recursive: true });
  console.log(`[copy-standalone] copied public -> .next/standalone/public`);
} else {
  console.warn(`[copy-standalone] warning: public/ not found, skipping`);
}

console.log("[copy-standalone] done ✓");
