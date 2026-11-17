// Builds the Netlify deployment package.
//   node scripts/build-netlify-package.mjs
// Output:
//   dist/slippy-morocco-netlify/       <- the folder Netlify should publish (index.html is at its top level)
//   dist/slippy-morocco-netlify.zip    <- the same folder zipped, index.html at the ZIP root
// Only files the running app needs (plus data provenance/licence notes) are included.
import { cpSync, mkdirSync, rmSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const OUT = "dist/slippy-morocco-netlify";
const ZIP = "dist/slippy-morocco-netlify.zip";

const FILES = [
  "index.html", "check.html", "manifest.webmanifest", "sw.js", "_headers",
  "css/map.css", "css/learn.css", "js/app.js", "js/learn.js",
  "data/learn/en.json",
  "data/rabat/roads.geojson", "data/rabat/water-lines.geojson", "data/rabat/water-areas.geojson", "data/rabat/sea.geojson",
  "data/rabat/manifest.json", "data/rabat/README.md",
];
const ICON_DIR = "icons"; // every icon file (SVG + PNG) ships

rmSync("dist", { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const file of FILES) {
  if (!existsSync(file)) throw new Error("Missing source file: " + file);
  mkdirSync(path.dirname(path.join(OUT, file)), { recursive: true });
  cpSync(file, path.join(OUT, file));
}
mkdirSync(path.join(OUT, ICON_DIR), { recursive: true });
for (const icon of readdirSync(ICON_DIR)) cpSync(path.join(ICON_DIR, icon), path.join(OUT, ICON_DIR, icon));

// -X: no extra file attributes, -r: recurse. Zip from inside the folder so there is no wrapper directory.
execFileSync("zip", ["-q", "-r", "-X", path.resolve(ZIP), "."], { cwd: OUT, stdio: "inherit" });
console.log("Publish directory:", OUT);
console.log("ZIP:", ZIP);
