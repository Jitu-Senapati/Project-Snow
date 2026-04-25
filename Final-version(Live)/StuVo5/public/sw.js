const SHELL_CACHE = "stuvo5-shell-v5";
const MEDIA_CACHE = "stuvo5-media-v3";
const MEDIA_CACHE_LIMIT = 300;

// ── Install: cache index.html + manifest immediately ─────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(SHELL_CACHE);
        // Fetch and store individually so one failure doesn't block others
        const toCache = ["/index.html", "/manifest.json", "/logo192px.png", "/logo512px.png"];
        await Promise.allSettled(
          toCache.map(async (url) => {
            try {
              const res = await fetch(url);
              if (res.ok) await cache.put(url, res);
            } catch {}
          })
        );
      } catch {}
      self.skipWaiting();
    })()
  );
});

// ── Activate: remove old caches ───────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();

      // Migrate old media cache into new — preserve cached images across upgrades
      const oldMediaKey = keys.find((k) => k.startsWith("stuvo5-media-") && k !== MEDIA_CACHE);
      if (oldMediaKey) {
        try {
          const [oldCache, newCache] = await Promise.all([
            caches.open(oldMediaKey),
            caches.open(MEDIA_CACHE),
          ]);
          const oldEntries = await oldCache.keys();
          await Promise.all(oldEntries.map(async (req) => {
            try {
              const res = await oldCache.match(req);
              if (res) await newCache.put(req, res.clone());
            } catch {}
          }));
        } catch {}
      }

      // Delete all old caches
      await Promise.all(
        keys.filter((k) => k !== SHELL_CACHE && k !== MEDIA_CACHE)
            .map((k) => caches.delete(k))
      );

      self.clients.claim();
    })()
  );
});

// ── Fetch ─────────────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // ── Firebase Storage — cache by pathname only (ignore auth tokens) ──
  const isFirebaseStorage =
    url.hostname === "firebasestorage.googleapis.com" ||
    url.hostname.endsWith(".firebasestorage.app");

  if (isFirebaseStorage) {
    if (url.pathname.includes("/profilePhotos/") || url.pathname.includes("/profilePictures/")) {
      return; // auth-protected
    }
    const cacheKey = url.origin + url.pathname;
    e.respondWith(
      (async () => {
        const cache = await caches.open(MEDIA_CACHE);
        const cached = await cache.match(cacheKey);

        // Always fetch fresh in background to keep cache up to date
        const networkFetch = fetch(request).then((res) => {
          if (res.ok) {
            cache.keys().then((keys) => {
              if (!cached && keys.length >= MEDIA_CACHE_LIMIT) cache.delete(keys[0]);
            });
            cache.put(cacheKey, res.clone());
          }
          return res;
        }).catch(() => null);

        // Cached → return immediately, network updates in background (no flicker)
        // Not cached → wait for network
        return cached || await networkFetch || Response.error();
      })()
    );
    return;
  }

  // ── Skip Firebase/Google API requests ──
  if (
    url.hostname.includes("firestore") ||
    url.hostname.includes("firebase") ||
    url.hostname.includes("googleapis") ||
    url.hostname !== self.location.hostname
  ) return;

  // ── Skip Vite dev server special URLs ──
  if (
    url.pathname.startsWith("/@vite/") ||
    url.pathname.startsWith("/@react-refresh") ||
    url.pathname.startsWith("/@fs/") ||
    url.pathname.startsWith("/src/") ||
    url.search.includes("t=") ||
    url.search.includes("v=")
  ) return;

  // ── Navigation — always serve index.html (SPA routing) ──
  if (request.mode === "navigate") {
    e.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        try {
          // Network first
          const res = await fetch(request);
          // Await cache writes so they complete before SW can be killed
          await Promise.all([
            cache.put(request.url, res.clone()),
            cache.put("/index.html", res.clone()),
          ]);
          return res;
        } catch {
          // Offline — try cached index.html with multiple key formats
          const cached =
            await cache.match(request.url) ||
            await cache.match(request) ||
            await cache.match("/index.html") ||
            await caches.match("/index.html", { ignoreVary: true }) ||
            await caches.match(self.location.origin + "/index.html", { ignoreVary: true });
          if (cached) return cached;
          return new Response(
            `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#7c3aed"><link rel="manifest" href="/manifest.json"><title>StuVo5</title><style>body{background:#0a0a0a;color:#aaa;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:12px}img{width:80px;border-radius:16px;opacity:.8}</style></head><body><img src="/logo192px.png"><p>No internet connection</p><p style="font-size:12px;color:#555">Please check your connection and try again</p></body></html>`,
            { headers: { "Content-Type": "text/html" } }
          );
        }
      })()
    );
    return;
  }

  // ── JS/CSS/asset chunks — stale-while-revalidate ──
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|ico|png|svg|webp|jpg|jpeg|json)$/) ||
    url.pathname.includes("/assets/")
  ) {
    e.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        // Serve cached immediately, update in background
        const networkFetch = fetch(request)
          .then((res) => { if (res.ok) cache.put(request, res.clone()); return res; })
          .catch(() => null);
        return cached || networkFetch || Response.error();
      })
    );
    return;
  }
});

// ── Messages from app ─────────────────────────────────────────────
self.addEventListener("message", (e) => {
  // Pre-cache a media file — store by pathname, ignore auth token
  if (e.data?.type === "CACHE_MEDIA" && e.data.url) {
    caches.open(MEDIA_CACHE).then(async (cache) => {
      try {
        const url = new URL(e.data.url);
        // Always use pathname-only as key so token rotation doesn't matter
        const cacheKey = url.origin + url.pathname;
        const already = await cache.match(cacheKey);
        if (!already) {
          // Fetch with full URL (includes token) but store with clean key
          const res = await fetch(e.data.url, { mode: "cors" });
          if (res.ok) {
            const keys = await cache.keys();
            if (keys.length >= MEDIA_CACHE_LIMIT) await cache.delete(keys[0]);
            cache.put(cacheKey, res);
          }
        }
      } catch {}
    });
  }

  // Pre-cache a JS/CSS chunk
  if (e.data?.type === "CACHE_CHUNK" && e.data.url) {
    caches.open(SHELL_CACHE).then(async (cache) => {
      try {
        const already = await cache.match(e.data.url);
        if (!already) {
          const res = await fetch(e.data.url);
          if (res.ok) cache.put(e.data.url, res);
        }
      } catch {}
    });
  }

  // Pre-cache a list of chunks at once
  if (e.data?.type === "CACHE_CHUNKS" && Array.isArray(e.data.urls)) {
    caches.open(SHELL_CACHE).then(async (cache) => {
      for (const url of e.data.urls) {
        try {
          const already = await cache.match(url);
          if (!already) {
            const res = await fetch(url);
            if (res.ok) cache.put(url, res);
          }
        } catch {}
      }
    });
  }
});