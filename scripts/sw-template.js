// Service worker for the PHE ePortfolio Hub. Generated into site/sw.js by `npm run build`; edit this template, not sw.js.
// It keeps the app files on the device so the lessons work offline, and refreshes them in the background when online.
const CACHE = "phe-hub-__VERSION__";
const FILES = __FILES__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.all(FILES.map((f) => cache.add(new Request(f, { cache: "reload" })).catch(() => {})))).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("phe-hub-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // only handle our own plain GET requests (not YouTube, MagicSchool, or audio range requests)
  if (req.method !== "GET" || url.origin !== location.origin || req.headers.has("range")) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => { if (res && res.ok && res.type === "basic") cache.put(req, res.clone()); return res; })
        .catch(() => null);
      if (cached) { event.waitUntil(network); return cached; }   // fast: show the saved copy, refresh it in the background
      const res = await network;
      if (res) return res;
      if (req.mode === "navigate") return (await cache.match("./")) || (await cache.match("index.html"));
      return new Response("Offline", { status: 503, statusText: "Offline" });
    })
  );
});
