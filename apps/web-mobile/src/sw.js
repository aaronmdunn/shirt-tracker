/**
 * Service Worker for Shirt Tracker (Desktop)
 *
 * Strategy:
 *   - App shell (index.html) -> Cache-first, fall back to network
 *   - Everything else (API calls, analytics, CDN scripts) -> Network-only
 *
 * Why cache-first for the shell?
 *   After the build, index.html is a single self-contained file (CSS + JS inlined).
 *   Serving it from cache means instant loads on repeat visits and full offline access.
 *   The cache is versioned by APP_VERSION, so every deploy busts the old cache automatically.
 *
 * Why NOT cache API calls or photos?
 *   - Supabase signed URLs expire hourly and are user-specific — caching them would
 *     serve stale/broken images and leak data across sessions.
 *   - Netlify functions (admin, backup, request-access) must always hit the network.
 *   - Analytics (GA, Plausible) should not be intercepted.
 */

const CACHE_NAME = "shirt-tracker-v__SW_VERSION__";

// Paths that ARE the app shell — these get cached
const APP_SHELL = [
  "./",          // index.html (relative to SW scope, i.e. /d/ or /m/)
  "./index.html"
];

// --- Install: pre-cache the app shell ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  // Activate immediately instead of waiting for all tabs to close
  self.skipWaiting();
});

// --- Activate: clean up old versioned caches ---
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name.startsWith("shirt-tracker-v") && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  // Take control of all open tabs immediately (don't wait for reload)
  self.clients.claim();
});

// --- Fetch: cache-first for shell, network-only for everything else ---
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin GET requests for the app shell.
  // Everything else (API calls, CDN scripts, analytics, POST requests) goes straight to network.
  if (event.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // Normalize: treat both "/" and "/index.html" relative to scope as shell requests
  const scopePath = new URL(self.registration.scope).pathname;
  const relativePath = url.pathname.startsWith(scopePath)
    ? url.pathname.slice(scopePath.length)
    : null;

  const isShell = relativePath === "" || relativePath === "index.html";

  if (!isShell) return;

  // Cache-first: serve from cache, fall back to network, update cache on success
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        // Always fetch a fresh copy in the background to keep cache warm
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => null); // Swallow network errors when offline

        // Serve cached version immediately if we have one
        if (cached) return cached;

        // No cache hit — wait for network (first visit)
        return networkFetch.then((response) => {
          if (response) return response;
          // Both cache and network failed — return a simple offline page
          return new Response(
            "<!DOCTYPE html><html><body style=\"font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#aaa;\"><p>You are offline. Please reconnect and reload.</p></body></html>",
            { headers: { "Content-Type": "text/html" } }
          );
        });
      })
    )
  );
});
