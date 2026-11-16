import { readFileSync, existsSync } from "node:fs";
const required=["index.html","manifest.webmanifest","sw.js","css/map.css","js/app.js","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-192.png","icons/icon-maskable-512.png","icons/apple-touch-icon.png","_headers","data/rabat/roads.geojson","data/rabat/water-lines.geojson","data/rabat/water-areas.geojson","data/rabat/manifest.json"];
const missing=required.filter((path)=>!existsSync(path));
if(missing.length){console.error("Missing required files:",missing.join(", "));process.exit(1);}
const pwa=JSON.parse(readFileSync("manifest.webmanifest","utf8"));
if(pwa.display!=="standalone"||!pwa.start_url||!Array.isArray(pwa.icons))throw new Error("PWA manifest is missing install metadata.");
const html=readFileSync("index.html","utf8");
for(const path of ["./manifest.webmanifest","./css/map.css","./js/app.js"])if(!html.includes(path))throw new Error("index.html does not reference "+path);
const js=readFileSync("js/app.js","utf8");
for(const path of ["./data/rabat/roads.geojson","./data/rabat/water-lines.geojson","./data/rabat/water-areas.geojson"])if(!js.includes(path))throw new Error("Map app does not reference "+path);
for(const path of required.filter((item)=>item.endsWith(".geojson"))){
 const layer=JSON.parse(readFileSync(path,"utf8"));
 if(layer.type!=="FeatureCollection"||!Array.isArray(layer.features))throw new Error("Invalid GeoJSON FeatureCollection: "+path);
 if(layer.features.length===0&&!path.endsWith("water-areas.geojson"))throw new Error("Unexpected empty required layer: "+path);
 console.log(path+": "+layer.features.length.toLocaleString()+" features");
}
JSON.parse(readFileSync("data/rabat/manifest.json","utf8"));
console.log("Rabat map app validation passed.");
