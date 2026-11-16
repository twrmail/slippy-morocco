// Verifies a built Netlify package ZIP (not the repo) is complete and self-consistent.
//   node scripts/verify-package.mjs dist/slippy-morocco-netlify.zip
// Extracts the ZIP to a temp folder and checks what Netlify would actually receive.
import { readFileSync, existsSync, mkdtempSync, readdirSync, statSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";

const zip = process.argv[2] || "dist/slippy-morocco-netlify.zip";
if (!existsSync(zip)) { console.error("ZIP not found: " + zip); process.exit(1); }
const root = mkdtempSync(path.join(tmpdir(), "slippy-pkg-"));
execFileSync("unzip", ["-q", path.resolve(zip), "-d", root]);

const errors = [];
const fail = (msg) => errors.push(msg);
const list = (dir, base = "") => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? list(path.join(dir, e.name), base + e.name + "/") : [base + e.name]);
const files = list(root).sort();
const has = (rel) => existsSync(path.join(root, rel));
const read = (rel) => readFileSync(path.join(root, rel), "utf8");

// 1. Required files at the ZIP root (no wrapper folder).
const required = ["index.html", "manifest.webmanifest", "sw.js", "_headers", "css/map.css", "js/app.js",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-192.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png",
  "data/rabat/roads.geojson", "data/rabat/water-lines.geojson", "data/rabat/water-areas.geojson", "data/rabat/manifest.json"];
for (const rel of required) if (!has(rel)) fail("Missing from ZIP root: " + rel);

// 2. Nothing unexpected (repo docs, scripts, workflows, source assets must not ship).
const allowed = /^(index\.html|manifest\.webmanifest|sw\.js|_headers|css\/[^/]+|js\/[^/]+|icons\/[^/]+|data\/rabat\/[^/]+)$/;
for (const rel of files) if (!allowed.test(rel)) fail("Unexpected file in ZIP: " + rel);

// 3. Every local reference must resolve inside the package, and use relative paths.
const refs = new Set();
const html = has("index.html") ? read("index.html") : "";
for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) if (!/^(https?:|#)/.test(m[1])) refs.add(m[1]);
const man = JSON.parse(read("manifest.webmanifest"));
refs.add(man.start_url); for (const i of man.icons) refs.add(i.src);
for (const m of read("sw.js").matchAll(/"(\.\/[^"]*)"/g)) refs.add(m[1]);
for (const m of read("js/app.js").matchAll(/"(\.\/[^"]*)"/g)) refs.add(m[1]);
for (const ref of refs) {
  if (!ref.startsWith("./")) { fail("Not a ./relative path: " + ref); continue; }
  const rel = ref.slice(2) || "index.html";
  if (!has(rel) && !has(rel.replace(/\/$/, "") + "/index.html")) fail("Referenced file missing from ZIP: " + ref);
}

// 4. Manifest: install metadata and real PNG sizes (read from each PNG's header).
if (man.display !== "standalone") fail("manifest display is not standalone");
for (const key of ["name", "short_name", "start_url", "scope", "theme_color", "background_color"]) if (!man[key]) fail("manifest missing " + key);
const png = (rel) => { const b = readFileSync(path.join(root, rel)); return b.readUInt32BE(16) + "x" + b.readUInt32BE(20); };
for (const i of man.icons) if (i.src.endsWith(".png") && has(i.src.slice(2)) && png(i.src.slice(2)) !== i.sizes) fail(`Icon ${i.src} is ${png(i.src.slice(2))}, manifest says ${i.sizes}`);
for (const [size, purpose] of [["192x192", "any"], ["512x512", "any"], ["192x192", "maskable"], ["512x512", "maskable"]])
  if (!man.icons.some((i) => i.sizes === size && i.purpose === purpose)) fail(`manifest lacks a ${size} ${purpose} icon`);
if (man.icons.some((i) => /any maskable|maskable any/.test(i.purpose || ""))) fail("an icon combines 'any maskable'; keep purposes separate");

// 5. Data integrity: GeoJSON bytes match the checksums recorded in data/rabat/manifest.json.
const dataManifest = JSON.parse(read("data/rabat/manifest.json"));
for (const [name, info] of Object.entries(dataManifest.outputs)) {
  if (!has("data/rabat/" + name)) { fail("Missing data file: " + name); continue; }
  const sha = createHash("sha256").update(readFileSync(path.join(root, "data/rabat", name))).digest("hex");
  if (sha !== info.sha256) fail(`Checksum mismatch for ${name}`);
}

// 6. Licensing/dependency guards.
if (!/openstreetmap\.org\/copyright/.test(html) || !/OpenStreetMap contributors/.test(html)) fail("OSM attribution missing from index.html");
for (const rel of ["index.html", "js/app.js", "sw.js"]) if (/tile\.openstreetmap\.org/.test(read(rel))) fail("Public OSM tile server referenced in " + rel);
if (!/maplibre-gl@5\.6\.2/.test(html)) fail("MapLibre is not pinned to 5.6.2 in index.html");

const bytes = files.reduce((n, f) => n + statSync(path.join(root, f)).size, 0);
rmSync(root, { recursive: true, force: true });
if (errors.length) { console.error("PACKAGE INVALID:\n - " + errors.join("\n - ")); process.exit(1); }
console.log(`Package OK: ${files.length} files, ${(bytes / 1e6).toFixed(1)} MB unzipped, ${(statSync(zip).size / 1e6).toFixed(1)} MB zipped`);
for (const f of files) console.log("  " + f);
