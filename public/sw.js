// StrideLog service worker: caches the app shell so the app opens offline.
// Pages: network first (fresh when online, cached copy when offline).
// Hashed build assets: cache first. Map tiles: stale-while-revalidate, capped.
const VERSION = 'v2';
const SHELL = `stridelog-shell-${VERSION}`;
const ASSETS = `stridelog-assets-${VERSION}`;
const TILES = `stridelog-tiles-${VERSION}`;
const PAGES = ['/', '/today', '/track', '/activities', '/calendar', '/exercises', '/badges', '/notes', '/photos', '/settings', '/onboarding'];
const TILE_HOSTS = ['tile.openstreetmap.org', 'tiles.stadiamaps.com'];
const MAX_TILES = 400;
const MAX_ASSETS = 300;

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL);
      const assets = await caches.open(ASSETS);
      for (const url of PAGES) {
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res.ok) continue;
          await shell.put(url, res.clone());
          // Also cache the JS/CSS each page needs, so the first offline launch works.
          const html = await res.text();
          const urls = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) ?? [])];
          await Promise.all(urls.map((u) => assets.add(u).catch(() => {})));
        } catch {
          // offline during install: the runtime caching below fills in later
        }
      }
      await shell.addAll(['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']).catch(() => {});
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = [SHELL, ASSETS, TILES];
      for (const key of await caches.keys()) if (!keep.includes(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (TILE_HOSTS.includes(url.hostname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(TILES);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            // Only cache CORS responses: opaque ones count as ~7 MB each against the storage quota.
            if (res.ok && res.type !== 'opaque') {
              cache.put(request, res.clone());
              trim(TILES, MAX_TILES);
            }
            return res;
          })
          .catch(() => cached ?? Response.error());
        return cached ?? network;
      })(),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSETS);
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) {
          cache.put(request, res.clone());
          trim(ASSETS, MAX_ASSETS);
        }
        return res;
      })(),
    );
    return;
  }

  const isPage = request.mode === 'navigate';
  const isRsc = request.headers.get('RSC') === '1' || url.searchParams.has('_rsc');
  if (isPage || isRsc) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL);
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(isPage ? url.pathname : request, res.clone());
          return res;
        } catch {
          const cached = await cache.match(isPage ? url.pathname : request);
          if (cached) return cached;
          if (isPage) return (await cache.match('/')) ?? Response.error();
          return Response.error();
        }
      })(),
    );
  }
});
