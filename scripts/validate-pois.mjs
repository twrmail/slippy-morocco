// Validates the Points of Interest (POI) data layer in data/pois/. No dependencies.
//   node scripts/validate-pois.mjs                    check everything (used by CI)
//   node scripts/validate-pois.mjs --update-manifest  after a deliberate data edit, refresh the manifest's file list and checksums
// Run from the repository root. Rules are written up in docs/poi-layer.md.
// scripts/test-validate-pois.mjs proves each rule below actually fires.
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
const CAPACITY_KEYS = ["status", "seats", "reported", "note"];
const REPORTED_KEYS = ["seats", "source"];

// Names that would mean third-party business data (ratings, photos, live status) crept in.
// Checked at EVERY depth of every record, not only the top level.
const FORBIDDEN_WORDS = new Set(["rating", "ratings", "review", "reviews", "photo", "photos", "image", "images", "price", "prices", "business", "hours"]);
const FORBIDDEN_PARTS = /google|open_?now|permanently_?closed|place_?id|business_?status|opening_?hours/i;
const looksForbidden = (key) => FORBIDDEN_PARTS.test(key) || key.toLowerCase().split(/[^a-z]+/).some((w) => FORBIDDEN_WORDS.has(w));
// A link into Google Maps/Search inside any text value is the same problem in a different shape.
const GOOGLE_LINK = /(^|[^a-z])(google\.[a-z.]+\/(maps|search|travel|localservices)|maps\.app\.goo\.gl|goo\.gl\/maps|g\.page|maps\.google\.)/i;

const errors = [];
const fail = (where, msg) => errors.push(where + ": " + msg);
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isStr = (s) => typeof s === "string" && s.trim().length > 0;
const isPosInt = (n) => Number.isInteger(n) && n > 0;
const isHex = (s, len) => typeof s === "string" && new RegExp("^[0-9a-f]{" + len + "}$").test(s);
const todayUtc = new Date().toISOString().slice(0, 10);
// A real calendar date: 2026-02-31 and 2026-04-31 are refused (Date.parse alone would accept them).
const isDate = (s) => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};
const isPastOrToday = (s) => isDate(s) && s <= todayUtc;
const isTimestamp = (s) => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s)) return false;
  return isDate(s.slice(0, 10)) && !Number.isNaN(Date.parse(s));
};
const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const sameList = (a, b) => Array.isArray(a) && a.length === b.length && a.every((v, i) => v === b[i]);

// Walks every key and string value at any depth.
function scanDeep(value, where, path = "") {
  if (typeof value === "string") {
    if (GOOGLE_LINK.test(value)) fail(where, "text at '" + (path || "record") + "' contains a Google Maps/Search link. Not allowed.");
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => scanDeep(v, where, path + "[" + i + "]"));
  } else if (isObj(value)) {
    for (const [k, v] of Object.entries(value)) {
      const here = path ? path + "." + k : k;
      if (looksForbidden(k)) fail(where, "field '" + here + "' looks like third-party business data (ratings, photos, live status). Not allowed.");
      scanDeep(v, where, here);
    }
  }
}

const updateManifest = process.argv.includes("--update-manifest");
const manifestPath = DIR + "/manifest.json";
if (!existsSync(manifestPath)) { console.error("Missing " + manifestPath); process.exit(1); }
let manifest;
try { manifest = JSON.parse(readFileSync(manifestPath, "utf8")); } catch (e) { console.error("manifest.json is not valid JSON: " + e.message); process.exit(1); }

const ids = new Map();
const osmIds = new Map();
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
    const p = isObj(f.properties) ? f.properties : {};
    const where = rel + " " + (p.id || "(no id)");
    if (f.type !== "Feature") fail(where, "not a Feature");
    if (!isObj(f.properties)) fail(where, "properties must be an object");
    for (const k of Object.keys(f)) if (!["type", "geometry", "properties"].includes(k)) fail(where, "unexpected feature key '" + k + "'");
    for (const k of REQUIRED) if (!(k in p)) fail(where, "missing field " + k);
    for (const k of Object.keys(p)) if (!REQUIRED.includes(k) && !OPTIONAL.includes(k) && !looksForbidden(k)) fail(where, "unknown field " + k);
    scanDeep(f.properties, where);

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
      if (!isObj(g) || g.type !== "Point" || !Array.isArray(g.coordinates) || g.coordinates.length !== 2 || g.coordinates.some((n) => typeof n !== "number" || !Number.isFinite(n))) fail(where, "matched record needs a Point geometry");
      else {
        const [lon, lat] = g.coordinates;
        if (lon < BBOX[0] || lon > BBOX[2] || lat < BBOX[1] || lat > BBOX[3]) fail(where, "position is outside the Rabat–Salé study window");
      }
      if (!["node", "way", "relation"].includes(p.osm_type)) fail(where, "osm_type must be node, way or relation");
      if (!isPosInt(p.osm_id)) fail(where, "osm_id must be a positive integer");
      if (p.source !== "OpenStreetMap") fail(where, "matched record must have source 'OpenStreetMap'");
      if (p.source_id !== p.osm_type + "/" + p.osm_id) fail(where, "source_id must equal osm_type/osm_id");
      if (!POSITION_FROM.includes(p.position_from)) fail(where, "position_from must be one of " + POSITION_FROM.join(", "));
      // One OSM feature, one record: never two places sharing a geographic record.
      const key = p.osm_type + "/" + p.osm_id;
      if (osmIds.has(key)) fail(where, "OSM feature " + key + " is already used by " + osmIds.get(key)); else osmIds.set(key, p.id);
    } else {
      if (g !== null) fail(where, "an unmatched record must have geometry null (no invented positions)");
      for (const k of ["osm_type", "osm_id", "source_id", "position_from"]) if (p[k] !== null) fail(where, k + " must be null when unmatched");
      if (p.source !== "unmatched") fail(where, "source must be 'unmatched'");
      if (p.match_status === "not-in-osm" && !isStr(p.match_note)) fail(where, "not-in-osm needs a match_note saying what was searched");
    }
    if (p.match_note !== undefined && !isStr(p.match_note)) fail(where, "match_note must be text");
    if (p.wikidata !== undefined && !/^Q\d+$/.test(p.wikidata)) fail(where, "wikidata must look like Q12345");

    if (!STATUS.includes(p.status)) fail(where, "status must be one of " + STATUS.join(", "));
    if (p.verified_at !== null && !isPastOrToday(p.verified_at)) fail(where, "verified_at must be a real calendar date (YYYY-MM-DD), not in the future, or null");
    if (p.verified_at !== null && (p.match_status !== "matched" || p.address_status !== "verified")) fail(where, "verified_at needs a matched position and a verified address");
    if (p.status === "ready" && (p.verified_at === null || p.match_status !== "matched")) fail(where, "status ready needs a matched position and verified_at");
    if (p.match_status !== "matched" && p.status !== "placeholder") fail(where, "a record with no position must have status placeholder");

    if (typeof p.featured !== "boolean") fail(where, "featured must be true or false");
    if (p.guide_topic !== null && !TOPICS.includes(p.guide_topic)) fail(where, "guide_topic must be null or one of " + TOPICS.join(", "));
    if (p.featured === true && p.guide_topic === null) fail(where, "a featured record needs a guide_topic");

    if (p.operating_status !== "unverified" && p.operating_status !== "verified") fail(where, "operating_status must be 'unverified' or 'verified'");
    if (p.operating_status === "verified" && (!isPastOrToday(p.operating_checked_at) || !isStr(p.operating_source))) fail(where, "verified operating status needs a real operating_checked_at date and an operating_source");
    if (p.operating_status === "unverified" && ("operating_checked_at" in p || "operating_source" in p)) fail(where, "operating_checked_at/operating_source belong only to a verified operating status");
    if (p.website !== null && !/^https:\/\/\S+$/.test(p.website || "")) fail(where, "website must be an https link or null");

    if (category === "football") {
      const c = p.capacity;
      if (!isObj(c)) fail(where, "a football record needs a capacity object");
      else {
        for (const k of Object.keys(c)) if (!CAPACITY_KEYS.includes(k) && !looksForbidden(k)) fail(where, "unknown capacity field " + k);
        if (!["VERIFY", "CONFIRMED"].includes(c.status)) fail(where, "capacity.status must be VERIFY or CONFIRMED");
        if (c.status === "VERIFY" && c.seats !== null) fail(where, "capacity.seats must be null while status is VERIFY");
        if (c.status === "CONFIRMED" && (!isPosInt(c.seats) || !isStr(c.source))) fail(where, "CONFIRMED capacity needs seats and an official source");
        if (c.note !== undefined && !isStr(c.note)) fail(where, "capacity.note must be text");
        if (!Array.isArray(c.reported)) fail(where, "capacity.reported must be a list");
        else c.reported.forEach((r, i) => {
          if (!isObj(r)) { fail(where, "capacity.reported[" + i + "] must be an object"); return; }
          for (const k of Object.keys(r)) if (!REPORTED_KEYS.includes(k) && !looksForbidden(k)) fail(where, "unknown field capacity.reported[" + i + "]." + k);
          if (!isPosInt(r.seats) || !isStr(r.source)) fail(where, "capacity.reported[" + i + "] needs seats and source");
        });
      }
    } else if ("capacity" in p) fail(where, "capacity belongs only on football records");
  }
  seen[category] = { total: fc.features.length, matched };
  fileSummary[rel] = { feature_count: fc.features.length, bytes: readFileSync(path).length, sha256: sha256(path) };
}

// Any extra data file next to the four layers would be unreviewed data.
if (existsSync(DIR + "/" + AREA)) {
  for (const name of readdirSync(DIR + "/" + AREA)) {
    if (!CATEGORIES.map((c) => c + ".geojson").includes(name)) fail(AREA + "/" + name, "unexpected file in the POI folder");
  }
}

// ---- Manifest: provenance fields must be complete and well formed ----
function checkManifest(m) {
  const w = "manifest";
  if (!isObj(m)) { fail(w, "must be an object"); return; }
  const TOP = ["project", "layer", "schema_version", "area", "area_note", "description", "categories", "osm_source", "acquisition", "non_osm_sources", "files"];
  for (const k of TOP) if (!(k in m)) fail(w, "missing " + k);
  for (const k of Object.keys(m)) if (!TOP.includes(k)) fail(w, "unknown key " + k);
  if (m.project !== "slippy-morocco") fail(w, "project must be slippy-morocco");
  if (m.layer !== "pois") fail(w, "layer must be pois");
  if (m.schema_version !== 1) fail(w, "schema_version must be 1");
  if (m.area !== AREA) fail(w, "area must be " + AREA);
  if (!sameList(m.categories, CATEGORIES)) fail(w, "categories must be " + CATEGORIES.join(", "));
  if (!isStr(m.non_osm_sources)) fail(w, "non_osm_sources must describe where non-OSM facts come from");

  const o = m.osm_source;
  if (!isObj(o)) fail(w, "osm_source must be an object");
  else {
    for (const k of ["name", "url", "license", "attribution", "attribution_url"]) if (!isStr(o[k])) fail(w, "osm_source." + k + " is missing");
    for (const k of Object.keys(o)) if (!["name", "url", "license", "attribution", "attribution_url"].includes(k)) fail(w, "osm_source has unknown key " + k);
    if (!/ODbL/.test(o.license || "")) fail(w, "osm_source.license must name ODbL");
    if (!/OpenStreetMap contributors/.test(o.attribution || "")) fail(w, "osm_source.attribution must name OpenStreetMap contributors");
    for (const k of ["url", "attribution_url"]) if (isStr(o[k]) && !/^https:\/\/\S+$/.test(o[k])) fail(w, "osm_source." + k + " must be an https link");
  }

  const a = m.acquisition;
  if (!isObj(a)) { fail(w, "acquisition must be an object"); return; }
  const AK = ["workflow", "workflow_run_id", "acquired_on", "pbf_data_timestamp", "pbf_bytes", "pbf_sha256", "candidates_file", "candidates_sha256", "candidates_count", "research_branch", "research_branch_commit", "note"];
  for (const k of AK) if (!(k in a)) fail(w, "acquisition." + k + " is missing");
  for (const k of Object.keys(a)) if (!AK.includes(k)) fail(w, "acquisition has unknown key " + k);
  if (!isStr(a.workflow) || !/^\.github\/workflows\/[\w.-]+\.yml$/.test(a.workflow)) fail(w, "acquisition.workflow must be a .github/workflows/*.yml path");
  else if (!existsSync(a.workflow)) fail(w, "acquisition.workflow points at a file that does not exist: " + a.workflow);
  if (!isPosInt(a.workflow_run_id)) fail(w, "acquisition.workflow_run_id must be a positive integer");
  if (!isPastOrToday(a.acquired_on)) fail(w, "acquisition.acquired_on must be a real calendar date, not in the future");
  if (!isTimestamp(a.pbf_data_timestamp)) fail(w, "acquisition.pbf_data_timestamp must be a real UTC timestamp like 2026-11-19T02:31:50Z");
  else if (isDate(a.acquired_on) && a.pbf_data_timestamp.slice(0, 10) > a.acquired_on) fail(w, "the OSM data timestamp cannot be later than the day it was acquired");
  if (!isPosInt(a.pbf_bytes)) fail(w, "acquisition.pbf_bytes must be a positive integer");
  if (!isHex(a.pbf_sha256, 64)) fail(w, "acquisition.pbf_sha256 must be 64 hex characters");
  if (!isHex(a.candidates_sha256, 64)) fail(w, "acquisition.candidates_sha256 must be 64 hex characters");
  if (!isPosInt(a.candidates_count)) fail(w, "acquisition.candidates_count must be a positive integer");
  if (!isHex(a.research_branch_commit, 40)) fail(w, "acquisition.research_branch_commit must be 40 hex characters");
  const stamp = isDate(a.acquired_on) ? a.acquired_on.replace(/-/g, "") : null;
  if (!/^research\/rabat-poi-candidates-\d{8}$/.test(a.research_branch || "")) fail(w, "acquisition.research_branch must look like research/rabat-poi-candidates-YYYYMMDD");
  else if (stamp && !a.research_branch.endsWith("-" + stamp)) fail(w, "acquisition.research_branch date does not match acquired_on");
  if (!/^research\/poi-candidates\/rabat-\d{8}\/candidates\.geojson$/.test(a.candidates_file || "")) fail(w, "acquisition.candidates_file must look like research/poi-candidates/rabat-YYYYMMDD/candidates.geojson");
  else if (stamp && !a.candidates_file.includes("rabat-" + stamp + "/")) fail(w, "acquisition.candidates_file date does not match acquired_on");
  if (!isStr(a.note)) fail(w, "acquisition.note is missing");

  const files = m.files;
  if (!isObj(files)) { fail(w, "files must be an object"); return; }
  for (const [rel, info] of Object.entries(files)) {
    if (!isObj(info)) { fail(w, "files." + rel + " must be an object"); continue; }
    for (const k of Object.keys(info)) if (!["feature_count", "bytes", "sha256"].includes(k)) fail(w, "files." + rel + " has unknown key " + k);
    if (!Number.isInteger(info.feature_count) || info.feature_count < 0) fail(w, "files." + rel + ".feature_count must be a whole number");
    if (!isPosInt(info.bytes)) fail(w, "files." + rel + ".bytes must be a positive integer");
    if (!isHex(info.sha256, 64)) fail(w, "files." + rel + ".sha256 must be 64 hex characters");
  }
}

if (updateManifest) {
  manifest.files = fileSummary;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log("Manifest file list refreshed.");
}
checkManifest(manifest);
if (!updateManifest) {
  for (const [rel, info] of Object.entries(fileSummary)) {
    const m = (manifest.files || {})[rel];
    if (!m) fail("manifest", rel + " is not listed");
    else {
      if (m.sha256 !== info.sha256) fail("manifest", rel + " checksum does not match. If the data change was deliberate, run with --update-manifest and commit the result.");
      if (m.feature_count !== info.feature_count) fail("manifest", rel + " feature_count does not match");
      if (m.bytes !== info.bytes) fail("manifest", rel + " byte size does not match");
    }
  }
  for (const rel of Object.keys(manifest.files || {})) if (!(rel in fileSummary)) fail("manifest", "lists missing file " + rel);
}

if (errors.length) {
  console.error("POI validation FAILED:\n - " + errors.join("\n - "));
  process.exit(1);
}
const total = Object.values(seen).reduce((a, s) => a + s.total, 0);
const matchedTotal = Object.values(seen).reduce((a, s) => a + s.matched, 0);
console.log("POI layer: " + total + " records (" + matchedTotal + " matched to OpenStreetMap, " + (total - matchedTotal) + " without a position). " +
  CATEGORIES.map((c) => c + "=" + (seen[c] ? seen[c].total : 0)).join(" "));
console.log("POI validation passed.");
