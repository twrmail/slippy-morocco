import { readFileSync, existsSync } from "node:fs";
const required=["index.html","manifest.webmanifest","sw.js","css/map.css","css/learn.css","js/app.js","js/learn.js","data/learn/en.json","icons/favicon-48.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-192.png","icons/icon-maskable-512.png","icons/apple-touch-icon.png","_headers","data/rabat/roads.geojson","data/rabat/water-lines.geojson","data/rabat/water-areas.geojson","data/rabat/sea.geojson","data/rabat/manifest.json"];
const missing=required.filter((path)=>!existsSync(path));
if(missing.length){console.error("Missing required files:",missing.join(", "));process.exit(1);}
const pwa=JSON.parse(readFileSync("manifest.webmanifest","utf8"));
if(pwa.display!=="standalone"||!pwa.start_url||!Array.isArray(pwa.icons))throw new Error("PWA manifest is missing install metadata.");
const html=readFileSync("index.html","utf8");
for(const path of ["./manifest.webmanifest","./css/map.css","./js/app.js"])if(!html.includes(path))throw new Error("index.html does not reference "+path);
const js=readFileSync("js/app.js","utf8");
for(const path of ["./data/rabat/roads.geojson","./data/rabat/water-lines.geojson","./data/rabat/water-areas.geojson","./data/rabat/sea.geojson"])if(!js.includes(path))throw new Error("Map app does not reference "+path);
for(const path of required.filter((item)=>item.endsWith(".geojson"))){
 const layer=JSON.parse(readFileSync(path,"utf8"));
 if(layer.type!=="FeatureCollection"||!Array.isArray(layer.features))throw new Error("Invalid GeoJSON FeatureCollection: "+path);
 if(layer.features.length===0&&!path.endsWith("water-areas.geojson"))throw new Error("Unexpected empty required layer: "+path);
 console.log(path+": "+layer.features.length.toLocaleString()+" features");
}
JSON.parse(readFileSync("data/rabat/manifest.json","utf8"));
// "Learn the Game": the page must load its files, the service worker must cache them, and the lesson text must be complete.
for(const path of ["./css/learn.css","./js/learn.js"])if(!html.includes(path))throw new Error("index.html does not reference "+path);
const sw=readFileSync("sw.js","utf8");
for(const path of ["./css/learn.css","./js/learn.js","./data/learn/en.json"])if(!sw.includes(path))throw new Error("sw.js app shell does not include "+path);
if(!readFileSync("js/learn.js","utf8").includes("./data/learn/"))throw new Error("js/learn.js does not load the lesson data.");
const learn=JSON.parse(readFileSync("data/learn/en.json","utf8"));
const focusKeys=["all","goals","centre","ball","offside","edges","penalty","ref","gk","def","mid","fwd"];
if(!Array.isArray(learn.lessons)||learn.lessons.length!==10)throw new Error("Expected 10 lessons in data/learn/en.json.");
const ids=new Set();
for(const lesson of learn.lessons){
 if(!lesson.id||ids.has(lesson.id))throw new Error("Lesson id missing or duplicated: "+lesson.id);ids.add(lesson.id);
 if(!lesson.title||!((lesson.paragraphs&&lesson.paragraphs.length)||(lesson.items&&lesson.items.length)))throw new Error("Lesson is empty: "+lesson.id);
 if(!focusKeys.includes(lesson.focus))throw new Error("Unknown pitch focus '"+lesson.focus+"' in lesson "+lesson.id);
}
for(const role of ["gk","def","mid","fwd","ref"])if(!learn.roles||!learn.roles[role]||!learn.roles[role].short||!learn.roles[role].name)throw new Error("Missing role text: "+role);
if(!/not an official FIFA product/.test(learn.footer.independence))throw new Error("Independence notice missing from the Learn footer.");
console.log("Learn the Game: "+learn.lessons.length+" lessons OK.");
console.log("Rabat map app validation passed.");
