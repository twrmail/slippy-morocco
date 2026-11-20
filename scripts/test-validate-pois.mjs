// Proves the POI validator really rejects bad data. Each case copies the real data to a temporary
// folder, breaks one thing, and expects scripts/validate-pois.mjs to fail with a specific message.
//   node scripts/test-validate-pois.mjs
// A validator that never fails is worthless, so this runs in CI next to the validator itself.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const validator = path.resolve("scripts/validate-pois.mjs");
const manifest = JSON.parse(readFileSync("data/pois/manifest.json", "utf8"));
const workflowRel = manifest.acquisition.workflow;

function fresh() {
  const root = mkdtempSync(path.join(tmpdir(), "poi-test-"));
  cpSync("data/pois", path.join(root, "data/pois"), { recursive: true });
  mkdirSync(path.join(root, path.dirname(workflowRel)), { recursive: true });
  cpSync(workflowRel, path.join(root, workflowRel));
  return root;
}
const readJson = (root, rel) => JSON.parse(readFileSync(path.join(root, rel), "utf8"));
const writeJson = (root, rel, v) => writeFileSync(path.join(root, rel), JSON.stringify(v, null, 2) + "\n");
// Edit one data file, then refresh the manifest so only the intended fault is present.
function editData(root, file, fn) {
  const rel = "data/pois/rabat/" + file;
  const fc = readJson(root, rel);
  fn(fc.features);
  writeJson(root, rel, fc);
  run(root, ["--update-manifest"], true);
}
function editManifest(root, fn) {
  const rel = "data/pois/manifest.json";
  const m = readJson(root, rel);
  fn(m);
  writeJson(root, rel, m);
}
function run(root, args = [], ignoreFailure = false) {
  try {
    const out = execFileSync("node", [validator, ...args], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, text: out };
  } catch (e) {
    if (ignoreFailure) return { code: e.status, text: String(e.stderr) };
    return { code: e.status, text: String(e.stderr) + String(e.stdout) };
  }
}

const cases = [];
const bad = (name, expect, setup) => cases.push({ name, expect, setup });

// ---- record-level faults ----
bad("Google-style field at top level", "google_place_id", (r) => editData(r, "stay.geojson", (f) => { f[0].properties.google_place_id = "x"; }));
bad("forbidden field nested inside capacity.reported", "capacity.reported[0].google_rating", (r) => editData(r, "football.geojson", (f) => { f[0].properties.capacity.reported[0].google_rating = 4.4; }));
bad("forbidden field nested inside capacity", "capacity.photos", (r) => editData(r, "football.geojson", (f) => { f[0].properties.capacity.photos = ["a"]; }));
bad("unknown nested field in capacity.reported", "unknown field capacity.reported[0].unit", (r) => editData(r, "football.geojson", (f) => { f[0].properties.capacity.reported[0].unit = "seats"; }));
bad("Google Maps link in a description", "Google Maps/Search link", (r) => editData(r, "stay.geojson", (f) => { f[0].properties.description = "A large hotel, see https://www.google.com/maps/place/xyz for details."; }));
bad("Google Maps short link in match_note", "Google Maps/Search link", (r) => editData(r, "eat.geojson", (f) => { f[0].properties.match_note = "from https://maps.app.goo.gl/abc123"; }));
bad("impossible calendar date in verified_at", "real calendar date", (r) => editData(r, "stay.geojson", (f) => { f[0].properties.verified_at = "2026-02-31"; }));
bad("future date in verified_at", "not in the future", (r) => editData(r, "stay.geojson", (f) => { f[0].properties.verified_at = "2099-01-01"; }));
bad("invented position on an unmatched record", "geometry null", (r) => editData(r, "eat.geojson", (f) => { const p = f.find((x) => x.properties.match_status === "not-in-osm"); p.geometry = { type: "Point", coordinates: [-6.83, 34.02] }; }));
bad("position outside the study window", "outside the Rabat", (r) => editData(r, "stay.geojson", (f) => { f[0].geometry.coordinates = [-1.0, 30.0]; }));
bad("two records sharing one OSM feature", "already used by", (r) => editData(r, "stay.geojson", (f) => { f[1].properties.osm_type = f[0].properties.osm_type; f[1].properties.osm_id = f[0].properties.osm_id; f[1].properties.source_id = f[0].properties.source_id; }));
bad("source_id disagrees with osm id", "source_id must equal", (r) => editData(r, "stay.geojson", (f) => { f[0].properties.source_id = "node/1"; }));
bad("featured record without a guide topic", "needs a guide_topic", (r) => editData(r, "see.geojson", (f) => { f[0].properties.guide_topic = null; }));
bad("stadium capacity given while still VERIFY", "capacity.seats must be null", (r) => editData(r, "football.geojson", (f) => { f[0].properties.capacity.seats = 68700; }));
bad("stadium without a capacity object", "needs a capacity object", (r) => editData(r, "football.geojson", (f) => { delete f[0].properties.capacity; }));
bad("restaurant marked verified without a source", "operating_checked_at", (r) => editData(r, "eat.geojson", (f) => { f[0].properties.operating_status = "verified"; }));
bad("status 'ready' with no verification date", "status ready needs", (r) => editData(r, "stay.geojson", (f) => { const p = f.find((x) => x.properties.verified_at === null); p.properties.status = "ready"; }));
bad("duplicate id across files", "duplicate id", (r) => editData(r, "see.geojson", (f) => { f[1].properties.id = f[0].properties.id; }));
bad("unexpected extra file in the POI folder", "unexpected file", (r) => writeFileSync(path.join(r, "data/pois/rabat/extra.geojson"), "{}"));

// ---- manifest faults ----
bad("data changed but manifest not refreshed", "checksum does not match", (r) => {
  const rel = "data/pois/rabat/stay.geojson";
  const fc = readJson(r, rel);
  fc.features[0].properties.description = "A different description that is long enough to pass the length check.";
  writeJson(r, rel, fc);
});
bad("manifest missing the PBF checksum", "acquisition.pbf_sha256 is missing", (r) => editManifest(r, (m) => { delete m.acquisition.pbf_sha256; }));
bad("manifest PBF checksum malformed", "pbf_sha256 must be 64 hex", (r) => editManifest(r, (m) => { m.acquisition.pbf_sha256 = "abc"; }));
bad("manifest unknown key", "unknown key surprise", (r) => editManifest(r, (m) => { m.surprise = 1; }));
bad("manifest impossible acquisition date", "acquired_on must be a real calendar date", (r) => editManifest(r, (m) => { m.acquisition.acquired_on = "2026-04-31"; }));
bad("manifest impossible OSM timestamp", "pbf_data_timestamp must be a real UTC timestamp", (r) => editManifest(r, (m) => { m.acquisition.pbf_data_timestamp = "2026-13-40T00:00:00Z"; }));
bad("manifest OSM timestamp later than acquisition day", "cannot be later", (r) => editManifest(r, (m) => { m.acquisition.pbf_data_timestamp = "2026-11-25T00:00:00Z"; }));
bad("manifest workflow file does not exist", "does not exist", (r) => editManifest(r, (m) => { m.acquisition.workflow = ".github/workflows/nope.yml"; }));
bad("manifest research branch date disagrees", "research_branch date does not match", (r) => editManifest(r, (m) => { m.acquisition.research_branch = "research/rabat-poi-candidates-20250101"; }));
bad("manifest commit hash malformed", "research_branch_commit must be 40 hex", (r) => editManifest(r, (m) => { m.acquisition.research_branch_commit = "abc123"; }));
bad("manifest licence not ODbL", "must name ODbL", (r) => editManifest(r, (m) => { m.osm_source.license = "CC0"; }));
bad("manifest attribution missing", "osm_source.attribution is missing", (r) => editManifest(r, (m) => { delete m.osm_source.attribution; }));

let failed = 0;
// Control: untouched data must pass, otherwise every "expected failure" below proves nothing.
{
  const root = fresh();
  const res = run(root);
  if (res.code !== 0) { failed++; console.error("FAIL control: unmodified data should pass.\n" + res.text); }
  else console.log("ok   control: unmodified data passes");
  rmSync(root, { recursive: true, force: true });
}
for (const c of cases) {
  const root = fresh();
  try {
    c.setup(root);
    const res = run(root);
    if (res.code === 0) { failed++; console.error("FAIL " + c.name + ": validator passed but should have failed."); }
    else if (!res.text.includes(c.expect)) { failed++; console.error("FAIL " + c.name + ": failed, but without the expected message '" + c.expect + "'.\n" + res.text); }
    else console.log("ok   " + c.name);
  } catch (e) {
    failed++; console.error("FAIL " + c.name + ": test setup error " + e.message);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
if (failed) { console.error("\n" + failed + " validator test(s) failed."); process.exit(1); }
console.log("\nAll " + (cases.length + 1) + " validator tests passed.");
