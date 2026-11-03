/* Dar Najat offline support.
   Pages: try the network first so new deploys show up right away, and fall back
   to the saved copy when there's no signal. Other files (styles, marks, icons):
   serve the saved copy and refresh it in the background.
   Weather and the database are never cached here; they always go live.
   Bump VERSION when this file's own logic changes. */
var VERSION = "dn-v1";
var CORE = [
  "./", "index.html", "playbook.html", "log.html",
  "site.css", "ptr.js", "manifest.webmanifest",
  "mark-on-navy.svg", "mark-small.svg", "favicon.svg", "dar-najat-days.ics"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // fonts, weather, database: not ours to cache

  if (req.mode === "navigate" || req.destination === "document") {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (hit) {
          return hit || caches.match("playbook.html");
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      var live = fetch(req).then(function (res) {
        if (res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return hit; });
      return hit || live;
    })
  );
});
