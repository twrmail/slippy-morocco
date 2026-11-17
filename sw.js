"use strict";
// Slippy Morocco service worker: caches ONLY the small same-origin app shell.
// That shell includes the "Learn the Game" view (its CSS, JS and lesson text), which therefore works offline.
// It does NOT cache the MapLibre library (jsDelivr), the map glyph fonts, or the
// ~18 MB GeoJSON map data, so the map itself still needs an internet connection.
// To release a change: bump CACHE_NAME (old caches are deleted on activate).
const CACHE_NAME = "slippy-morocco-shell-v6";
const APP_SHELL = [
  "./", "./index.html", "./css/map.css", "./css/learn.css", "./js/app.js", "./js/learn.js",
  "./data/learn/en.json", "./manifest.webmanifest",
  "./icons/favicon-48.png", "./icons/icon-192.png", "./icons/icon-512.png",
  "./icons/icon-maskable-192.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"
];
const SHELL_URLS = new Set(APP_SHELL.map((path) => new URL(path, self.location).href));

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});
// Network first for the shell (so a new deploy shows up on the next visit), cache as fallback offline.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isShell = url.origin === self.location.origin && (request.mode === "navigate" || SHELL_URLS.has(url.href));
  if (!isShell) return; // map data, MapLibre and fonts go straight to the network
  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)); }
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || caches.match("./index.html")))
  );
});
