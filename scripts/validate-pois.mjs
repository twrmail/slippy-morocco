// Validates the Points of Interest (POI) data layer in data/pois/. No dependencies.
//   node scripts/validate-pois.mjs                    check everything (used by CI)
//   node scripts/validate-pois.mjs --update-manifest  after a deliberate data edit, refresh the manifest's file list and checksums
// Rules are written up in docs/poi-layer.md.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

const DIR = "data/pois";
const AREA = "rabat";
const BBOX = [-6.98, 33.9, -6.7, 34.12]; // west, south, east, north: the Rabat–Salé study window
const CATEGORIES = ["stay", "eat", "see", "football"];
const TOPICS = ["must-see", "where-to-stay", "eat", "match-day-stadiums"];
const ADDRESS_STATUS = ["verified", "cross-checked", "unverified"];
const STATUS = ["ready", "verify", "placeholder"];
const MATCH = ["matched", "unmatched", "not-in-osm"];
const POSITION_FROM = ["point", "area-centroid", "line-average"];

const REQUIRED = ["id", "name", "aliases", "category", "description", "address", "address_status", "address_source",
  "osm_type", "osm_id", "source", "source_id", "position_from", "match_status", "verified_at", "status",
  "featured", "guide_topic", "operating_status", "website"];
const OPTIONAL = ["match_note", "wikidata", "capacity", "operating_checked_at", "operating_source"];
// Fields that would mean third-party business data (ratings, photos, live status) crept in.
const FORBIDDEN_WORDS = new Set(["rating", "ratings", "review", "reviews", "photo", "photos", "image", "images", "price", "prices", "business", "hours"]);
const FORBIDDEN_PARTS = /google|open_?now|permanently_?closed|place_?id|business_?status|opening_?hours/i;
const looksForbidden = (key) => FORBIDDEN_PARTS.test(key) || key.toLowerCase().split(/[^a-z]+/).some((w) => FORBIDDEN_WORDS.has(w));

const errors = [];
const fail = (where, msg) => errors.push(where + ": " + msg);
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const isStr = (s) => typeof s === "string" && s.trim().length > 0;
const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

const updateManifest = process.argv.includes("--update-manifest");
const manifestPath = DIR + "/manifest.json";
if (!existsSync(manifestPath)) { console.error("Missing " + manifestPath); process.exit(1); }
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const ids = new Map();
const counts = {};
const seen = {};
const fileSummary = {};

for (const category of CATEGORIES) {
  const rel = AREA + "/" + category + ".geojson";
  const path = DIR + "/" + rel;
  if (!existsSync(path)) { fail(rel, "file is missing"); continue; }
  let fc;
  try { fc = JSON.parse(readFileSync(path, "utf8")); } catch (e) { fail(rel, "not valid JSON: " + e.message); continue; }
  if (fc.type !== "FeatureCollection" || !Array.isArray(fc.features)) { fail(rel, "not a FeatureCollection"); continue; }
  let matched = 0;
  for (const f of fc.features) {
    const p = f.properties || {};
    const where = rel + " " + (p.id || "(no id)");
    if (f.type !== "Feature") fail(where, "not a Feature");
    for (const k of REQUIRED) if (!(k in p)) fail(where, "missing field " + k);
    for (const k of Object.keys(p)) {
      if (looksForbidden(k)) fail(where, "field '" + k + "' looks like third-party business data (ratings, photos, live status). Not allowed.");
      else if (!REQUIRED.includes(k) && !OPTIONAL.includes(k)) fail(where, "unknown field " + k);
    }
    if (!/^rabat-[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id || "")) fail(where, "id must look like rabat-some-name");
    if (ids.has(p.id)) fail(where, "duplicate id (also in " + ids.get(p.id) + ")"); else ids.set(p.id, rel);
    if (!isStr(p.name)) fail(where, "name is empty");
    if (!Array.isArray(p.aliases) || p.aliases.some((a) => !isStr(a))) fail(where, "aliases must be a list of strings");
    if (p.category !== category) fail(where, "category '" + p.category + "' does not match file " + category + ".geojson");
    if (!isStr(p.description) || p.description.length < 20 || p.description.length > 400) fail(where, "description must be 20 to 400 characters, written in our own words");

    if (!ADDRESS_STATUS.includes(p.address_status)) fail(where, "address_status must be one of " + ADDRESS_STATUS.join(", "));
    if (p.address !== null && !isStr(p.address)) fail(where, "address must be text or null");
    if (p.address_status !== "unverified" && (p.address === null || !isStr(p.address_source))) fail(where, "a verified or cross-checked address needs the address text and address_source");

    if (!MATCH.includes(p.match_status)) fail(where, "match_status must be one of " + MATCH.join(", "));
    const g = f.geometry;
    if (p.match_status === "matched") {
      matched++;
      if (!g || g.type !== "Point" || !Array.isArray(g.coordinates) || g.coordinates.length !== 2 || g.coordinates.some((n) => typeof n !== "number")) fail(where, "matched record needs a Point geometry");
      else {
        const [lon, lat] = g.coordinates;
        if (lon < BBOX[0] || lon > BBOX[2] || lat < BBOX[1] || lat > BBOX[3]) fail(where, "position is outside the Rabat–Salé study window");
      }
      if (!["node", "way", "relation"].includes(p.osm_type)) fail(where, "osm_type must be node, way or relation");
      if (!Number.isInteger(p.osm_id) || p.osm_id <= 0) fail(where, "osm_id must be a positive integer");
      if (p.source !== "OpenStreetMap") fail(where, "matched record must have source 'OpenStreetMap'");
      if (p.source_id !== p.osm_type + "/" + p.osm_id) fail(where, "source_id must equal osm_type/osm_id");
      if (!POSITION_FROM.includes(p.position_from)) fail(where, "position_from must be one of " + POSITION_FROM.join(", "));
    } else {
      if (g !== null) fail(where, "an unmatched record must have geometry null (no invented positions)");
      for (const k of ["osm_type", "osm_id", "source_id", "position_from"]) if (p[k] !== null) fail(where, k + " must be null when unmatched");
      if (p.source !== "unmatched") fail(where, "source must be 'unmatched'");
      if (!isStr(p.match_note) && p.match_status === "not-in-osm") fail(where, "not-in-osm needs a match_note saying what was searched");
    }
    if (p.wikidata !== undefined && !/^Q\d+$/.test(p.wikidata)) fail(where, "wikidata must look like Q12345");

    if (!STATUS.includes(p.status)) fail(where, "status must be one of " + STATUS.join(", "));
    if (p.verified_at !== null && !isDate(p.verified_at)) fail(where, "verified_at must be YYYY-MM-DD or null");
    if (p.verified_at !== null && (p.match_status !== "matched" || p.address_status !== "verified")) fail(where, "verified_at needs a matched position and a verified address");
    if (p.status === "ready" && (p.verified_at === null || p.match_status !== "matched")) fail(where, "status ready needs a matched position and verified_at");
    if (p.match_status !== "matched" && p.status !== "placeholder") fail(where, "a record with no position must have status placeholder");

    if (typeof p.featured !== "boolean") fail(where, "featured must be true or false");
    if (p.guide_topic !== null && !TOPICS.includes(p.guide_topic)) fail(where, "guide_topic must be null or one of " + TOPICS.join(", "));
    if (p.featured === true && p.guide_topic === null) fail(where, "a featured record needs a guide_topic");

    if (p.operating_status !== "unverified" && p.operating_status !== "verified") fail(where, "operating_status must be 'unverified' or 'verified'");
    if (p.operating_status === "verified" && (!isDate(p.operating_checked_at) || !isStr(p.operating_source))) fail(where, "verified operating status needs operating_checked_at and operating_source");
    if (category === "eat" && p.operating_status === "verified" && !isStr(p.operating_source)) fail(where, "restaurant status stays unverified until checked at a named source");
    if (p.website !== null && !/^https:\/\/\S+$/.test(p.website || "")) fail(where, "website must be an https link or null");

    if (category === "football") {
      const c = p.capacity;
      if (!c || typeof c !== "object") fail(where, "a football record needs a capacity object");
      else {
        if (!["VERIFY", "CONFIRMED"].includes(c.status)) fail(where, "capacity.status must be VERIFY or CONFIRMED");
        if (c.status === "VERIFY" && c.seats !== null) fail(where, "capacity.seats must be null while status is VERIFY");
        if (c.status === "CONFIRMED" && (!Number.isInteger(c.seats) || !isStr(c.source))) fail(where, "CONFIRMED capacity needs seats and an official source");
        if (!Array.isArray(c.reported) || c.reported.some((r) => !Number.isInteger(r.seats) || !isStr(r.source))) fail(where, "capacity.reported must list {seats, source}");
      }
    } else if ("capacity" in p) fail(where, "capacity belongs only on football records");
  }
  counts[category] = fc.features.length;
  seen[category] = { total: fc.features.length, matched };
  fileSummary[rel] = { feature_count: fc.features.length, bytes: readFileSync(path).length, sha256: sha256(path) };
}

// Any extra data file next to the four layers would be unreviewed data.
if (existsSync(DIR + "/" + AREA)) {
  for (const name of readdirSync(DIR + "/" + AREA)) {
    if (!CATEGORIES.map((c) => c + ".geojson").includes(name)) fail(AREA + "/" + name, "unexpected file in the POI folder");
  }
}

// Manifest
if (updateManifest) {
  manifest.files = fileSummary;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log("Manifest file list refreshed.");
} else {
  for (const [rel, info] of Object.entries(fileSummary)) {
    const m = (manifest.files || {})[rel];
    if (!m) fail("manifest", rel + " is not listed");
    else {
      if (m.sha256 !== info.sha256) fail("manifest", rel + " checksum does not match. If the data change was deliberate, run with --update-manifest and commit the result.");
      if (m.feature_count !== info.feature_count) fail("manifest", rel + " feature_count does not match");
    }
  }
  for (const rel of Object.keys(manifest.files || {})) if (!(rel in fileSummary)) fail("manifest", "lists missing file " + rel);
}
const lic = manifest.osm_source && manifest.osm_source.license;
if (!/ODbL/.test(lic || "")) fail("manifest", "osm_source.license must name ODbL");
if (!/OpenStreetMap contributors/.test((manifest.osm_source || {}).attribution || "")) fail("manifest", "osm_source.attribution is missing");

if (errors.length) {
  console.error("POI validation FAILED:\n - " + errors.join("\n - "));
  process.exit(1);
}
const total = Object.values(seen).reduce((a, s) => a + s.total, 0);
const matchedTotal = Object.values(seen).reduce((a, s) => a + s.matched, 0);
console.log("POI layer: " + total + " records (" + matchedTotal + " matched to OpenStreetMap, " + (total - matchedTotal) + " without a position). " +
  CATEGORIES.map((c) => c + "=" + (seen[c] ? seen[c].total : 0)).join(" "));
console.log("POI validation passed.");
