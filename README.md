# StrideLog

A run & walk tracker built with Next.js 16: live GPS map, dashboard, calendar, badges, daily notes and photos, bodyweight exercises and a daily plan. Everything is stored in the browser (localStorage + IndexedDB) behind a repository layer, so a backend can be added later without touching the UI.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # Vitest: geo, fitness, stats, badges, wellness, tasks
npm run build && npm start   # production build (service worker is only registered in production)
```

### Testing GPS

- **Desktop:** on the Track page (dev only) use **Developer: GPS simulator** to feed a fake 2 km loop at 1×, 5× or 20× speed. You can also set a location in Chrome DevTools → More tools → Sensors.
- **Phone:** geolocation needs HTTPS. Run `npm run dev:https` and open `https://<your-laptop-ip>:3000` on the same Wi-Fi (accept the certificate warning), or use a tunnel (`ngrok http 3000` / `cloudflared tunnel --url http://localhost:3000`). LAN and tunnel hosts are already allowed in `next.config.ts`.

## How GPS tracking works

Phone GPS keeps wandering 5–20 m even when you stand still, so raw positions can't be added up directly. `lib/gps.ts` filters them:

- **Standing still adds nothing.** Fixes are averaged into a resting point; movement only starts once several fixes are clearly beyond the GPS accuracy (and the jitter actually observed) and keep moving away, or the phone's own speed says you're moving. Impossible jumps (multipath spikes) are ignored, and a "start" that never really left the spot is rolled back.
- **Moving:** a median-of-3 filter removes spikes, a Kalman filter smooths the track, and route points are spaced 10–20 m apart (wider when accuracy is poor) so sideways jitter doesn't inflate the distance.
- **Stopping** is detected from the phone's speed when available (about 3 s), otherwise from the position trend. Anything recorded after the real stop is dropped, and with **auto-pause** (Settings, on by default) the timer stops from that moment and restarts when you move.

`lib/__tests__/gps.test.ts` replays realistic noisy GPS (drift, jitter, spikes, poor urban signal, sparse updates) through the real tracking store: standing still for 5 minutes adds 0 m, and walks, runs and stop-and-go sessions are measured within a few percent. In development, the Track page's **GPS simulator** has a **Stand still** button to try it yourself.

## Maps

CARTO's free basemaps (the original plan) now return an "API key required" tile, so the app uses **OpenStreetMap** tiles by default (darkened with a CSS filter in dark mode). OSM tiles are fine for personal use but not for a busy public app. Before a public launch, create a free [Stadia Maps](https://stadiamaps.com/) key and set:

```bash
NEXT_PUBLIC_STADIA_API_KEY=your-key
```

All map code lives in `components/map/`.

## Where things are

| Path | What |
|------|------|
| `app/` | Routes (each page wraps a client view in `ClientOnly`) |
| `components/` | UI by feature: `tracking`, `map`, `dashboard`, `activities`, `calendar`, `badges`, `notes`, `photos`, `exercises`, `today`, `settings`, `layout` |
| `lib/` | Pure, tested logic: `geo`, `fitness`, `stats`, `badges`, `wellness`, `tasks`, `format` |
| `data/` | Types, Dexie database, repositories (swap `local*Repo` for an API later), backup, badge service, exercise library |
| `store/` | Zustand stores: settings, badges, live tracking session (persisted), install prompt |
| `public/sw.js` | Hand-written service worker (offline app shell + map tile cache) |

## Good to know

- If a CSS change doesn't show up in `npm run dev`, stop the server and delete `.next/dev` (Turbopack's dev cache), then start again.
- Water, food and sleep suggestions are general guidance from public health and sports-nutrition guidelines, not medical advice.
- Settings → **Export all data** downloads a JSON backup (photos included); **Import** restores it.
