// Service worker minimal : ne touche JAMAIS aux requêtes externes (Supabase, cartes, polices...).
// Pour les fichiers du site : on essaie toujours le réseau d'abord (donc les mises à jour passent),
// et on utilise la copie gardée en mémoire seulement si l'appareil est hors ligne.
var CACHE = "passeport-impro-v1";

self.addEventListener("install", function (e) {
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // externe : on laisse faire le navigateur
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || (req.mode === "navigate" ? caches.match("./") || caches.match("index.html") : undefined);
      });
    })
  );
});
