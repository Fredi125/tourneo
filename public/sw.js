/* Service worker minimal — cache-first sur trois fichiers statiques.
   Changez CACHE à chaque déploiement pour forcer la mise à jour. */
const CACHE = "tourneo-v1";
const FICHIERS = ["./tourneo.html", "./manifest.webmanifest", "./sw.js"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(FICHIERS);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (cles) {
      return Promise.all(cles.filter(function (k) { return k !== CACHE; })
                            .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function (rep) {
      return rep || fetch(e.request).then(function (reseau) {
        const copie = reseau.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copie); });
        return reseau;
      }).catch(function () {
        return caches.match("./tourneo.html");
      });
    })
  );
});
