(() => {
  "use strict";
  const status = document.getElementById("map-status");
  const setStatus = (message) => { status.textContent = message || ""; };
  if (!window.maplibregl) { setStatus("The map library could not load. Check your connection and reload."); return; }

  const map = new maplibregl.Map({
    container:"map", attributionControl:false,
    style:{version:8,glyphs:"https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",sources:{},layers:[{id:"background",type:"background",paint:{"background-color":"#e9e5da"}}]},
    center:[-6.84,34.02],zoom:11.2,minZoom:9,maxZoom:19,
    maxBounds:[[-7.05,33.84],[-6.62,34.18]]
  });
  map.addControl(new maplibregl.NavigationControl({showCompass:false}),"top-right");

  map.on("load",()=>{
    map.addSource("water-areas",{type:"geojson",data:"./data/rabat/water-areas.geojson"});
    map.addSource("water-lines",{type:"geojson",data:"./data/rabat/water-lines.geojson"});
    map.addSource("roads",{type:"geojson",data:"./data/rabat/roads.geojson"});
    map.addLayer({id:"water-areas-fill",type:"fill",source:"water-areas",paint:{"fill-color":"#b8dce6","fill-opacity":.96}});
    map.addLayer({id:"water-lines-casing",type:"line",source:"water-lines",paint:{"line-color":"#a4cfdb","line-width":["interpolate",["linear"],["zoom"],8,1.2,14,4,18,9]}});
    map.addLayer({id:"water-lines",type:"line",source:"water-lines",paint:{"line-color":"#78b8ca","line-width":["interpolate",["linear"],["zoom"],8,.7,14,2.5,18,6]}});
    map.addLayer({id:"roads-casing",type:"line",source:"roads",paint:{"line-color":"#fffdf8","line-width":["interpolate",["linear"],["zoom"],8,.35,12,1.5,16,4.2,19,7]}});
    map.addLayer({
      id:"roads-main",type:"line",source:"roads",
      paint:{
        "line-color":["match",["get","highway"],["motorway","motorway_link","trunk","trunk_link"],"#c58d58",["primary","primary_link"],"#d3a96e",["secondary","secondary_link"],"#e0c18d",["tertiary","tertiary_link"],"#eee0c3","#fffaf0"],
        "line-width":["interpolate",["linear"],["zoom"],8,["match",["get","highway"],["motorway","trunk","primary"],1.2,.25],12,["match",["get","highway"],["motorway","trunk","primary"],3,["secondary","tertiary"],1.3,.55],16,["match",["get","highway"],["motorway","trunk","primary"],6.5,["secondary","tertiary"],4,2]],
        "line-opacity":.96
      }
    });
    map.addLayer({
      id:"road-labels",type:"symbol",source:"roads",minzoom:14,
      layout:{"symbol-placement":"line","text-field":["coalesce",["get","name"],["get","name:fr"],["get","name:ar"],""],"text-font":["Open Sans Regular"],"text-size":10,"text-max-angle":30,"symbol-spacing":300},
      paint:{"text-color":"#59666a","text-halo-color":"#fffdf8","text-halo-width":1.5}
    });
    setStatus("Roads and water · Rabat–Salé study area");
    map.once("idle",()=>{if("serviceWorker" in navigator && location.protocol!=="file:") navigator.serviceWorker.register("./sw.js").catch(()=>{});});
  });
  map.on("error",(event)=>{const message=event&&event.error&&event.error.message?event.error.message:"";if(message)setStatus("A map layer could not load. "+message);});

  let installPrompt=null;
  const installButton=document.getElementById("install-button");
  window.addEventListener("beforeinstallprompt",(event)=>{event.preventDefault();installPrompt=event;installButton.hidden=false;});
  installButton.addEventListener("click",async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;installButton.hidden=true;});
})();
