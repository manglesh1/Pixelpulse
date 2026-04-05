// ─────────────────────────────────────────────────────────────────────────────
// Service Worker — GameRoom Kiosk
// Caches scorecard and all static assets so the UI survives a network blip.
// Strategy:
//   • Static assets (JS/CSS/images/fonts) → Cache-First (fast, always available)
//   • HTML pages                          → Network-First (fresh content, offline fallback)
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION = "v1";
const STATIC_CACHE  = `gameroom-static-${CACHE_VERSION}`;
const PAGE_CACHE    = `gameroom-pages-${CACHE_VERSION}`;
const OFFLINE_URL   = "/offline.html";

// Pages to pre-cache on install
const PRECACHE_PAGES = [
  "/scorecard",
  "/scorecard/",
  OFFLINE_URL,
];

// ── Install: pre-cache critical pages ────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.addAll(PRECACHE_PAGES))
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: serve from cache or network ───────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests (ignore WebSocket ws://)
  if (url.protocol === "ws:" || url.protocol === "wss:") return;
  if (url.origin !== self.location.origin) return;

  // Static assets → Cache-First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML navigation → Network-First with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Everything else → Network-First
  event.respondWith(networkFirst(request, PAGE_CACHE));
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/images/") ||
    /\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf|otf|css)$/.test(pathname)
  );
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Asset unavailable offline", { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("Unavailable offline", { status: 503 });
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Try the cached version of the exact page first
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fall back to the offline page
    return caches.match(OFFLINE_URL);
  }
}
