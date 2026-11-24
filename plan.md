# StrideLog: Health Tracker App, Build Plan (v1: UI + Local Storage)

> **Goal of v1:** A modern, responsive (mobile / tablet / desktop) health tracker built with **Next.js**.
> It records **runs and walks with a live GPS map** and has a **dashboard**, a **calendar**, **badges**, **daily notes** and **daily photos**.
> All data lives **in the browser** for now (localStorage + IndexedDB). The storage layer is designed so a backend can be added later without rewriting the UI.

---

## 0. How to Use This File

1. Work through the phases **in order** (Phase 1 → Phase 12). Each phase ends with **✅ Done when** checks. Don't move on until they pass.
2. Tick the `- [ ]` boxes as you go.
3. If you use an AI assistant in VS Code (Copilot Chat, Claude Code, Cursor, etc.), paste **one phase at a time** with this instruction:
   *"Implement Phase N of plan.md exactly. Follow the folder structure, data models and conventions in sections 2–4."*
4. Commit to git after every phase: `git commit -m "phase N: <name>"`.

---

## 1. Feature List (v1 scope)

| # | Feature | Notes |
|---|---------|-------|
| 1 | **Live tracking (Run / Walk)** | Start / pause / resume / stop. Live map follows your position and draws the route. Shows distance, time, pace, speed, calories and estimated steps. |
| 2 | **Dashboard** | Today's count, weekly count, monthly count, distance, calories, streak, charts, recent activities. |
| 3 | **Activity history** | List and detail page with the route map replay and splits per km. |
| 4 | **Calendar** | Month view that marks days you ran, walked or did both. Tap a day to see details. Shows the current streak. |
| 5 | **Badges** | Unlocked automatically (first run, 5K, streaks, distance totals...). Unlocking plays a confetti animation. |
| 6 | **Daily notes** | One note per day: mood, energy, free text, tags. |
| 7 | **Daily photos** | Progress photo per day (camera or gallery), compressed and stored in IndexedDB, with a gallery and a before/after compare view. |
| 8 | **Settings / profile** | Name, weight, height, daily/weekly goals, units (km/mi), theme, data export/import. |
| 9 | **Installable app (PWA)** | "Add to Home Screen" on phone, app icon, works full screen. |

> "Monthly cost" in the original idea list is treated as **monthly count** (activities, distance and calories per month).

---

## 2. Tech Stack

| Area | Choice | Why |
|------|--------|-----|
| Framework | **Next.js (latest, App Router) + TypeScript** | Routing and layouts, and easy to add API routes or a backend later |
| Styling | **Tailwind CSS v4** | Fast, responsive utilities |
| UI components | **shadcn/ui** (Radix based) + **lucide-react** icons | Accessible and modern-looking components that you own the code for |
| Animation | **motion** (Framer Motion) | Smooth page and card transitions |
| Map | **Leaflet + react-leaflet** with **OpenStreetMap / CARTO tiles** | Free, no API key, works well on mobile |
| Charts | **Recharts** | Simple, responsive charts |
| State + localStorage | **Zustand** with the `persist` middleware | Tiny, and persists to localStorage automatically |
| Large data (photos, GPS points) | **Dexie.js** (IndexedDB) | localStorage has a ~5 MB limit. Photos and long routes need IndexedDB. |
| Dates | **date-fns** | Week, month and streak math |
| Theme | **next-themes** | Dark/light toggle |
| Toasts | **sonner** | Notifications such as "Badge unlocked!" |
| Confetti | **canvas-confetti** | Badge celebration |
| IDs | **nanoid** | IDs for records |
| PWA | **Serwist** (`@serwist/next`) or a manual `manifest.ts` | Installable app |
| Tests | **Vitest** for the logic utils | Check distance, pace, streak and badge logic |

> **Map alternative:** For a more "Strava-like" vector map later, swap to **MapLibre GL** (`react-map-gl/maplibre`). Keep all map code inside `components/map/` so the swap is easy.

---

## 3. Folder Structure

```
stridelog/
├─ app/
│  ├─ layout.tsx                 # Root layout: ThemeProvider, AppShell, Toaster
│  ├─ page.tsx                   # Dashboard (/)
│  ├─ track/page.tsx             # Live tracking (/track)
│  ├─ activities/page.tsx        # History list
│  ├─ activities/[id]/page.tsx   # Activity detail + route map
│  ├─ calendar/page.tsx
│  ├─ badges/page.tsx
│  ├─ notes/page.tsx
│  ├─ photos/page.tsx
│  ├─ settings/page.tsx
│  ├─ onboarding/page.tsx        # First-launch profile setup
│  ├─ manifest.ts                # PWA manifest
│  └─ globals.css
├─ components/
│  ├─ layout/        AppShell.tsx, BottomNav.tsx, Sidebar.tsx, TopBar.tsx
│  ├─ map/           LiveMap.tsx, RouteMap.tsx, MapClient.tsx (dynamic, ssr:false), RecenterButton.tsx
│  ├─ tracking/      TrackControls.tsx, LiveStats.tsx, ActivityTypeToggle.tsx, GpsStatus.tsx, CountdownOverlay.tsx
│  ├─ dashboard/     StatCard.tsx, GoalRing.tsx, WeeklyChart.tsx, MonthlyChart.tsx, StreakCard.tsx, RecentActivities.tsx
│  ├─ calendar/      MonthCalendar.tsx, DayCell.tsx, DayDetailSheet.tsx
│  ├─ badges/        BadgeCard.tsx, BadgeUnlockDialog.tsx
│  ├─ notes/         NoteEditor.tsx, MoodPicker.tsx, NoteList.tsx
│  ├─ photos/        PhotoUploader.tsx, PhotoGrid.tsx, PhotoCompare.tsx
│  └─ ui/            (shadcn components)
├─ hooks/
│  ├─ useGeolocation.ts          # watchPosition wrapper
│  ├─ useTracker.ts              # tracking state machine
│  ├─ useWakeLock.ts             # keep screen on while tracking
│  └─ useHydrated.ts             # avoid SSR/localStorage mismatch
├─ lib/
│  ├─ geo.ts                     # haversine, pace, speed, splits, GPS filtering
│  ├─ fitness.ts                 # calories (MET), steps estimate
│  ├─ stats.ts                   # daily/weekly/monthly aggregates, streaks
│  ├─ badges.ts                  # badge definitions + evaluator
│  ├─ format.ts                  # formatDuration, formatPace, formatDistance
│  ├─ image.ts                   # compress photo → webp blob
│  └─ simulate.ts                # fake GPS route for testing on desktop
├─ data/
│  ├─ types.ts                   # all TypeScript models
│  ├─ db.ts                      # Dexie database (IndexedDB)
│  └─ repositories/              # storage abstraction (swap for API later)
│     ├─ activityRepo.ts
│     ├─ noteRepo.ts
│     ├─ photoRepo.ts
│     └─ index.ts
├─ store/
│  ├─ settingsStore.ts           # Zustand + persist (localStorage)
│  ├─ badgeStore.ts              # unlocked badges (localStorage)
│  └─ trackingStore.ts           # live session (persisted so a refresh doesn't lose a run)
└─ public/icons/                 # PWA icons 192/512, badge SVGs
```

---

## 4. Data Models (`data/types.ts`)

```ts
export type ActivityType = 'run' | 'walk';

export interface GeoPoint {
  lat: number;
  lng: number;
  t: number;        // timestamp (ms)
  acc: number;      // accuracy (meters)
  alt?: number | null;
  speed?: number | null; // m/s from device if available
}

export interface Activity {
  id: string;
  type: ActivityType;
  startedAt: number;     // ms
  endedAt: number;       // ms
  durationSec: number;   // moving time (excludes pauses)
  distanceM: number;
  avgPaceSecPerKm: number;
  maxSpeedMps: number;
  calories: number;
  steps: number;         // estimated
  route: GeoPoint[];     // stored in IndexedDB
  splits: { km: number; paceSecPerKm: number }[];
  title?: string;        // e.g. "Morning Run"
  createdAt: number;
}

export interface DailyNote {
  date: string;          // 'yyyy-MM-dd' (one per day)
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  text: string;
  tags: string[];        // e.g. ['sore', 'great-sleep']
  updatedAt: number;
}

export interface DailyPhoto {
  id: string;
  date: string;          // 'yyyy-MM-dd'
  blob: Blob;            // compressed webp
  thumbBlob: Blob;       // small thumbnail for the grid
  caption?: string;
  createdAt: number;
}

export interface Settings {
  name: string;
  weightKg: number;
  heightCm: number;
  units: 'km' | 'mi';
  dailyGoalSteps: number;      // e.g. 8000
  weeklyGoalActivities: number; // e.g. 4
  weeklyGoalKm: number;        // e.g. 20
  theme: 'dark' | 'light' | 'system';
  onboarded: boolean;
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;          // lucide icon name or /icons/badges/*.svg
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  check: (ctx: BadgeContext) => boolean;
}

export interface UnlockedBadge { id: string; unlockedAt: number; activityId?: string }
```

**Where each piece of data lives**

| Data | Storage | Reason |
|------|---------|--------|
| Settings, unlocked badges, live tracking session | localStorage (Zustand persist) | Small and needed instantly |
| Activities (incl. route points), notes | IndexedDB (Dexie) | Can grow large |
| Photos | IndexedDB (Blob) | Too big for localStorage |

---

## 5. Design System (Modern & Attractive)

- **Style:** dark-first, deep navy/near-black background (`#0B0F1A`), glassy cards (`bg-white/5 backdrop-blur border-white/10`), rounded `2xl` corners, soft shadows.
- **Accent colours:**
  - Run → **orange/coral gradient** (`#FF6B35 → #FF3D71`)
  - Walk → **teal/green gradient** (`#00D4AA → #00B4D8`)
  - Badges → gold `#FFC94D`
- **Typography:** `Inter` or `Plus Jakarta Sans` via `next/font`. Big bold numbers for stats (`text-5xl font-bold tabular-nums`).
- **Motion:** cards fade/slide in, the stat numbers count up, the goal rings animate, and buttons scale slightly on tap.
- **Light mode:** same layout, white cards, softer accents.
- **Accessibility (WCAG AA):** contrast ≥ 4.5:1, visible focus rings, buttons ≥ 44×44 px, `aria-live="polite"` on live stats, icons always have labels, respect `prefers-reduced-motion`.

**Responsive layout**

| Screen | Navigation | Layout |
|--------|-----------|--------|
| Mobile `< 768px` | **Bottom tab bar** (Home, Track, Calendar, Badges, More) with a big round **Start** button in the middle | Single column |
| Tablet `768–1024px` | Bottom bar or collapsed icon sidebar | 2-column grids |
| Desktop `> 1024px` | **Left sidebar** with labels | 3–4 column dashboard grid; track page = map on left, stats panel on right |

Use safe-area padding (`env(safe-area-inset-bottom)`) so the bottom bar doesn't sit under the iPhone home indicator.

---

## PHASE 1 — Project Setup

- [x] Create the project:
  ```bash
  npx create-next-app@latest stridelog --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"
  cd stridelog
  ```
- [x] Install dependencies:
  ```bash
  npm i leaflet react-leaflet zustand dexie dexie-react-hooks date-fns recharts motion next-themes sonner canvas-confetti nanoid lucide-react
  npm i -D @types/leaflet @types/canvas-confetti vitest
  ```
- [x] Set up shadcn/ui:
  ```bash
  npx shadcn@latest init
  npx shadcn@latest add button card dialog sheet tabs badge progress input textarea label switch select tooltip dropdown-menu separator skeleton slider toggle-group
  ```
- [x] Add the font with `next/font` in `app/layout.tsx`.
- [x] Add the colour tokens (run/walk/gold gradients) to `globals.css` as CSS variables.
- [x] Create the empty folder structure from Section 3.
- [x] `git init` and make the first commit.

**✅ Done when:** `npm run dev` runs at `http://localhost:3000` and a shadcn `Button` renders with your theme.

---

## PHASE 2 — App Shell, Navigation & Theme

- [x] `ThemeProvider` (next-themes, default `dark`) in the root layout.
- [x] `AppShell` renders `Sidebar` on `lg:` screens and `BottomNav` on smaller screens.
- [x] `BottomNav`: 5 items with a raised gradient **Start** button in the centre that links to `/track`. Highlight the active route using `usePathname()`.
- [x] `TopBar`: page title, greeting ("Good morning, Shivam"), theme toggle.
- [x] Create placeholder pages for every route in Section 3.
- [x] Page transition animation with `motion`.
- [x] `useHydrated()` hook: render skeletons until the client has mounted, so localStorage data doesn't cause hydration errors.

**✅ Done when:** you can navigate every page on mobile width (Chrome DevTools → iPhone) and desktop width, and the theme toggle works.

---

## PHASE 3 — Storage Layer (Local Now, Backend Later)

This is the most important step for the future backend. **UI components never touch localStorage or Dexie directly.** They only use repositories and stores.

- [x] `data/db.ts`: Dexie database:
  ```ts
  import Dexie, { Table } from 'dexie';
  import type { Activity, DailyNote, DailyPhoto } from './types';

  class AppDB extends Dexie {
    activities!: Table<Activity, string>;
    notes!: Table<DailyNote, string>;
    photos!: Table<DailyPhoto, string>;
    constructor() {
      super('stridelog');
      this.version(1).stores({
        activities: 'id, type, startedAt',
        notes: 'date, updatedAt',
        photos: 'id, date, createdAt',
      });
    }
  }
  export const db = new AppDB();
  ```
- [x] Repository interfaces with async methods, for example:
  ```ts
  export interface ActivityRepo {
    list(range?: { from: number; to: number }): Promise<Activity[]>;
    get(id: string): Promise<Activity | undefined>;
    save(a: Activity): Promise<void>;
    remove(id: string): Promise<void>;
  }
  ```
  Implement `localActivityRepo`, `localNoteRepo` and `localPhotoRepo` with Dexie. Export them from `data/repositories/index.ts`. **Later you only swap these for `apiActivityRepo` etc.**
- [x] `store/settingsStore.ts`: Zustand + `persist` (key `stridelog-settings`).
- [x] `store/badgeStore.ts`: unlocked badges (persisted).
- [x] Use `useLiveQuery` from `dexie-react-hooks` in pages so the UI updates automatically when data changes.
- [x] Settings page: **Export all data** (JSON download; photos as base64) and **Import** (restore from that file). This is the backup until the backend exists.

**✅ Done when:** you can save a fake activity from a test button, refresh the page, and still see it.

---

## PHASE 4 — Onboarding & Settings

- [x] `/onboarding` (shown when `settings.onboarded === false`): 3 steps in a swipeable card flow:
  1. Name
  2. Weight & height (needed for calories and step estimates)
  3. Goals (daily steps, weekly activities, weekly km)
- [x] `/settings`: edit all of the above, units km/mi, theme, export/import, "Reset all data" (with a confirm dialog).
- [x] Redirect to onboarding from `AppShell` when the user isn't onboarded yet.

**✅ Done when:** first launch shows onboarding, and the values persist and show on the settings page.

---

## PHASE 5 — Core Logic Utils (with tests)

Write these as **pure functions** in `lib/` and test them with Vitest.

- [x] `lib/geo.ts`
  ```ts
  // Haversine distance in meters
  export function distanceM(a: {lat:number;lng:number}, b: {lat:number;lng:number}) {
    const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng/2)**2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  ```
  - `totalDistance(points)`
  - `paceSecPerKm(distanceM, durationSec)`
  - `computeSplits(points)`: pace for each full km
  - **`shouldAcceptPoint(prev, next, type)`: GPS noise filter** (very important for accurate tracking):
    - reject if `acc > 30` m
    - reject if moved `< 3` m (jitter while standing still)
    - reject if the implied speed is impossible (`> 12 m/s` for a run, `> 4 m/s` for a walk)
- [x] `lib/fitness.ts`
  - Calories (MET formula): `kcal = MET × weightKg × hours`. Use MET ≈ **3.5 for a walk** and **9.8 for a run**. For better accuracy, pick MET by speed (walk 3–5 km/h → 3.0–3.8; run 8 km/h → 8.3, 10 km/h → 9.8, 12 km/h → 11.8).
  - Steps estimate: `distanceM / strideM`, where stride = `heightCm × 0.415 / 100` for a walk and `heightCm × 0.65 / 100` for a run. (Real step counting needs a native app; label it "est. steps" in the UI.)
- [x] `lib/stats.ts`
  - `todayStats`, `weekStats` (Monday start), `monthStats`: count, distance, duration, calories, steps
  - `dailySeries(days)` for the charts
  - `currentStreak(activities)` and `longestStreak(activities)` (days in a row with ≥1 activity)
- [x] `lib/format.ts`: `formatDuration(sec)` → `"1:05:32"`, `formatPace(secPerKm)` → `"5'42\"/km"`, `formatDistance(m, units)`.
- [x] `vitest` tests for: haversine (known distance), the noise filter, streaks across month boundaries, and calorie math.

**✅ Done when:** `npx vitest run` passes.

---

## PHASE 6 — Live Map & Tracking ⭐ (most important)

### 6.1 Map setup (Leaflet in Next.js)
- [x] Leaflet uses `window`, so **load the map with SSR disabled**:
  ```tsx
  // components/map/MapClient.tsx
  'use client';
  import dynamic from 'next/dynamic';
  export const LiveMap = dynamic(() => import('./LiveMap'), { ssr: false, loading: () => <MapSkeleton /> });
  ```
- [x] Import `leaflet/dist/leaflet.css` inside `LiveMap.tsx`.
- [x] Fix the default marker icon issue in Next.js (use a custom `L.divIcon` instead; it looks better anyway).
- [x] Tiles:
  - Dark theme: CARTO Dark Matter `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
  - Light theme: CARTO Voyager `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`
  - Always show the attribution (© OpenStreetMap contributors © CARTO).
  - Before a public launch, check the tile provider's usage terms or move to a provider with a free API key (MapTiler, Stadia).

### 6.2 "Where am I" live location
- [x] `hooks/useGeolocation.ts` wraps `navigator.geolocation.watchPosition`:
  ```ts
  navigator.geolocation.watchPosition(onPos, onErr, {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 15000,
  });
  ```
  Return `{ position, accuracy, heading, error, permission }` and clear the watch on unmount.
- [x] Check permission with `navigator.permissions.query({ name: 'geolocation' })` and show a friendly card if it's denied ("Enable location in browser settings").
- [x] **Current-location marker:** pulsing blue dot (CSS animation) + **accuracy circle** (`<Circle radius={accuracy}>`) + heading arrow when `heading` is available.
- [x] **Follow mode:** the map auto-centres on you (`map.panTo`) while following. If the user drags the map, follow pauses and a **Recenter** button appears.
- [x] Show **GpsStatus** chip: "Searching…" / "GPS Good (±5 m)" / "Weak signal (±40 m)".

### 6.3 Tracking state machine (`hooks/useTracker.ts` + `store/trackingStore.ts`)
```
idle → countdown(3,2,1) → tracking ⇄ paused → finished(summary) → saved
```
- [x] **Before start:** pick **Run** or **Walk** (toggle with colour change). The map already shows your location. Disable Start until the first GPS fix arrives with accuracy < 50 m.
- [x] **Tracking:** each accepted point (Phase 5 filter) is appended to `route`. Update distance, moving time (exclude paused time), current pace (rolling over the last ~30 s), average pace, calories and steps.
- [x] **Route polyline** drawn live with the run/walk gradient colour. Mark the start with a green dot.
- [x] **Pause/Resume:** a pause breaks the polyline into segments (no straight line across the gap).
- [x] **Persist the live session** to localStorage every few seconds, so an accidental refresh or tab close can **resume** ("You have an unfinished run. Resume?").
- [x] **`useWakeLock`**: request `navigator.wakeLock.request('screen')` during tracking so the phone screen doesn't sleep (browsers stop GPS when the screen locks). Re-request it on `visibilitychange`.
- [x] Optional: vibrate (`navigator.vibrate(200)`) each km + toast "1 km · 5'40\"/km".
- [x] **Stop:** long-press (hold 1.5 s) to stop, so you don't end a run by accident → summary sheet with a map preview, stats and splits, and buttons **Save** / **Discard** + an editable title ("Morning Run" auto-generated from the time of day).
- [x] On save: `activityRepo.save()`, then run the **badge evaluator** (Phase 9), then navigate to the activity detail page.

### 6.4 Track page UI
- **Mobile:** full-screen map, floating glass stats panel at the bottom (big Time, Distance, Pace), with Pause/Stop buttons. Swipe the panel up to show more stats (calories, steps, speed, splits).
- **Desktop:** map on the left 2/3, stats panel on the right 1/3.
- Lock the map gesture conflict: in tracking mode the map is still pannable, but the bottom panel captures its own swipes.

### 6.5 Testing GPS without going outside
- [x] `lib/simulate.ts`: a dev-only **"Simulate route"** button that feeds fake points (e.g. a 2 km loop around your area) every second into the same tracker pipeline.
- [x] Chrome DevTools → **More tools → Sensors → Location** to set a fake location.
- [ ] **Testing on your real phone:** geolocation needs **HTTPS** (localhost is the only exception). Use one of:
  - `next dev --experimental-https` and open `https://<your-laptop-ip>:3000` on the phone (same Wi-Fi, accept the certificate warning), or
  - a tunnel such as `ngrok http 3000` or `cloudflared tunnel --url http://localhost:3000`.

> **Known browser limitation:** web apps can't track reliably in the background when the screen is off (especially on iOS Safari). The Wake Lock keeps the screen on during tracking. True background tracking needs a native wrapper (Capacitor / React Native) — a later version.

**✅ Done when:** you can do a real 10-minute walk with your phone. The blue dot follows you, the route line draws, distance is within ~5% of the real route, a refresh mid-walk can resume, and the saved activity appears in history.

---

## PHASE 7 — Activity History & Detail

- [x] `/activities`: list grouped by week, each card showing the type icon/colour, title, date, distance, time, pace, and a **mini route thumbnail** (a small static `RouteMap` with interactions disabled).
- [x] Filter chips: All / Run / Walk. Sort by date or distance.
- [x] `/activities/[id]`: big route map (`fitBounds` to the route), start/end markers, stats grid, **splits bar chart**, pace-over-time line chart, delete (with confirm), edit title.
- [x] Optional nice touch: a **"Replay"** button that animates a marker along the route.

**✅ Done when:** saved activities show their routes correctly and deleting one updates the dashboard and calendar.

---

## PHASE 8 — Dashboard (`/`)

Layout top to bottom (mobile) / grid (desktop):

- [x] **Greeting + today's date** + a quick **Start Run / Start Walk** button.
- [x] **Today card:** goal ring for est. steps vs the daily goal, and today's activity count, distance and calories.
- [x] **Stat cards row** (tabs: **Day / Week / Month**):
  - Activities count
  - Distance
  - Active time
  - Calories
  - (each with a ▲/▼ % change vs the previous period)
- [x] **Weekly chart:** bars for Mon–Sun distance, coloured by run/walk (stacked).
- [x] **Monthly chart:** area/line chart of distance per day for the current month, plus month totals.
- [x] **Streak card:** 🔥 current streak and longest streak, with a "Don't break it!" message if you haven't moved today.
- [x] **Weekly goal progress:** activities X/Y and km X/Y as progress bars.
- [x] **Latest badge** card + **Recent activities** (last 3).
- [x] **Today's note & photo** shortcut cards ("Add today's note" / "Add today's photo" when empty).
- [x] Empty state for new users: friendly illustration + "Start your first walk".
- [x] Numbers count up on load; skeleton loaders while data loads.

**✅ Done when:** the counts match the history page for today, this week and this month.

---

## PHASE 9 — Badges System 🏅

- [x] `lib/badges.ts`: list of `BadgeDef` objects, each with a pure `check(ctx)` function. `ctx` contains all activities, totals, streaks, notes count and photos count.

| Badge | Rule | Tier |
|-------|------|------|
| First Steps | First walk saved | Bronze |
| First Run | First run saved | Bronze |
| 5K Finisher | Single run ≥ 5 km | Silver |
| 10K Hero | Single run ≥ 10 km | Gold |
| Half Marathon | Single run ≥ 21.1 km | Platinum |
| Streak 3 / 7 / 30 | Active 3 / 7 / 30 days in a row | Bronze / Silver / Gold |
| 50 km Club / 100 km Club / 500 km Club | Lifetime distance | Silver / Gold / Platinum |
| Early Bird | Activity started before 7:00 | Bronze |
| Night Owl | Activity started after 21:00 | Bronze |
| Busy Week | 5+ activities in one week | Silver |
| Speedster | Run with avg pace under 5:00/km (≥ 3 km) | Gold |
| Journaler | 7 daily notes | Bronze |
| Progress Pics | 30 daily photos | Silver |

- [x] `evaluateBadges(ctx, unlocked)` returns newly unlocked badges. Call it after saving an activity, note or photo.
- [x] On unlock: **BadgeUnlockDialog** with confetti 🎉, the badge icon scaling in, name and description, and a "Nice!" button. Queue multiple unlocks one after another.
- [x] `/badges` page: grid of all badges. Locked ones are greyscale with a lock and a **progress hint** (e.g. "7.4 / 10 km", "Streak 4 / 7"). Unlocked ones show their tier colour and unlock date.
- [x] Tier styles: bronze / silver / gold / platinum gradient rings.

**✅ Done when:** a simulated 5 km run unlocks "First Run" + "5K Finisher" with the celebration, and they stay unlocked after a refresh.

---

## PHASE 10 — Calendar 📅

- [x] `/calendar`: month view (build it with date-fns, or start from shadcn `Calendar`/react-day-picker and customise the day cell).
- [x] Each day cell shows markers:
  - 🟠 orange dot = ran
  - 🟢 teal dot = walked
  - both dots = both
  - 📝 small icon = note exists, 📷 = photo exists
  - today has a ring; future days are dimmed
- [x] Optional **intensity fill** (GitHub-heatmap style) by distance that day.
- [x] Header: month switcher (‹ ›), swipe left/right on mobile, "Today" button.
- [x] Month summary under the calendar: active days X/30, total km, current streak, longest streak.
- [x] Tap a day → **DayDetailSheet** (bottom sheet on mobile, side panel on desktop) showing that day's activities, note and photo, with "Add note" / "Add photo" for that date.
- [x] "Rest day" days just show as empty. No guilt messaging.

**✅ Done when:** days with activities are marked correctly, including across month boundaries and timezones (always use local dates `yyyy-MM-dd`).

---

## PHASE 11 — Daily Notes & Daily Photos

### 11.1 Notes (`/notes`)
- [x] Today's note editor at the top: **MoodPicker** (5 emoji faces 😞→😄), energy slider (1–5), textarea, quick tags (`#sore`, `#great-sleep`, `#tired`, `#pr`, custom).
- [x] **Auto-save** while typing (debounced 800 ms) with a "Saved ✓" indicator.
- [x] A date picker to write notes for past days.
- [x] Note history list (newest first), searchable, with the mood emoji per day.
- [x] Optional: a small mood-over-time chart.

### 11.2 Photos (`/photos`)
- [x] **PhotoUploader:** `<input type="file" accept="image/*" capture="user">` opens the camera on mobile; on desktop it shows file pick + drag & drop.
- [x] `lib/image.ts`: compress in the browser with canvas → max 1080 px long edge, **WebP ~0.8 quality**, plus a 300 px thumbnail. Store both blobs via `photoRepo`. Fix orientation using `createImageBitmap(file, { imageOrientation: 'from-image' })`.
- [x] One photo per day by default (offer "replace" if one exists).
- [x] **PhotoGrid:** responsive grid (2 cols mobile → 5 cols desktop) grouped by month, lazy-loaded thumbnails (`URL.createObjectURL`, and **revoke** the URLs on unmount to avoid memory leaks).
- [x] Tap → full-screen viewer with swipe between days, caption and delete.
- [x] **PhotoCompare:** pick two dates → before/after slider (drag a handle to reveal).
- [x] Show storage usage (`navigator.storage.estimate()`) on the settings page, and call `navigator.storage.persist()` so the browser doesn't clear the photos.

**✅ Done when:** you can take a photo on your phone, refresh, and see it in the grid and calendar; notes auto-save and reappear.

---

## PHASE 12 — PWA, Polish & QA

### 12.1 PWA ("Add to app" / Home Screen)
- [x] `app/manifest.ts`: name, short_name `StrideLog`, `display: 'standalone'`, theme/background colour, icons 192 & 512 (+ maskable).
- [x] Apple tags: `apple-touch-icon`, and `appleWebApp` in the metadata.
- [ ] Service worker with **Serwist** for offline app-shell caching (map tiles need network; cache recently viewed tiles if you want).
- [x] An in-app "Install app" button using the `beforeinstallprompt` event (Android/desktop Chrome). Show iOS-specific instructions ("Share → Add to Home Screen").

### 12.2 Polish
- [x] Empty states, loading skeletons and error states on every page.
- [x] Toasts for save, delete and errors.
- [x] Haptics (`navigator.vibrate`) on start/stop.
- [x] `prefers-reduced-motion` disables confetti and heavy animations.
- [x] Units switch (km/mi) applied everywhere through `format.ts`.

### 12.3 QA checklist
- [ ] Test on: Android Chrome, iPhone Safari, iPad, desktop Chrome/Firefox/Edge.
- [x] Widths: 360, 390, 768, 1024, 1440 px. No horizontal scroll and nothing hidden under the bottom bar.
- [x] Lighthouse: Performance ≥ 90, Accessibility ≥ 95, PWA installable.
- [x] Keyboard-only navigation works on desktop, and screen-reader labels are on all icon buttons.
- [x] Location denied → helpful message, no crash.
- [x] Long activity (60+ min, ~3600 points) stays smooth (throttle polyline re-render; only append new points).
- [x] Data survives refresh, and export → reset → import restores everything.

**✅ Done when:** the app installs on your phone, looks good on all sizes, and passes the QA list.

---

## PHASE 13 — Wellness Extras (added on request after v1)

- [x] **Activity maps:** labelled **Start** and **Finish** pins plus direction arrows along the route (activity detail, save summary and live map).
- [x] **Speed:** average speed on every activity card, a Pace / Speed toggle on the activity chart, and a **Running vs walking speed** card (average + best) on the dashboard and the activities page.
- [x] **Recovery after each activity:** water to drink (sweat loss × 1.25), carbs and protein to eat, electrolytes for long or sweaty sessions, and meal ideas (`lib/wellness.ts`).
- [x] **Exercises (`/exercises`):** 22 no-equipment bodyweight exercises (strength, core, cardio, mobility) with steps and runner tips, 5 guided routines with an interval timer; finished exercises are logged for the day.
- [x] **Daily plan (`/today`):** a checklist that resets every day: steps (auto from activities), 3 bodyweight exercises, water (+250 / +500 ml buttons), protein, fruit & veg, a recovery meal on workout days, sleep, and your own repeating tasks.
- [x] **How much you need:** daily targets for movement, exercise, water, calories / protein / carbs and sleep, personalised from weight, height, age and sex (new profile fields), with a "not medical advice" note.
- [x] Day logs stored in IndexedDB (Dexie v2 `days` table), included in export / import and reset.

---

## 13. Suggested Timeline (part-time, ~2 hrs/day)

| Week | Phases |
|------|--------|
| Week 1 | Phase 1–5 (setup, shell, storage, onboarding, logic + tests) |
| Week 2 | Phase 6 (live map & tracking, plus real outdoor tests) |
| Week 3 | Phase 7–9 (history, dashboard, badges) |
| Week 4 | Phase 10–12 (calendar, notes, photos, PWA, polish, QA) |

---

## 14. Later Versions (after v1)

**v2 — Backend & accounts**
- Next.js Route Handlers / Server Actions + **PostgreSQL (Supabase or Neon) + Prisma/Drizzle**, or Supabase directly.
- Auth (Auth.js / Supabase Auth / Clerk).
- Photos in object storage (Supabase Storage / Cloudflare R2 / S3).
- Swap `local*Repo` → `api*Repo` (UI unchanged thanks to Phase 3). Add a one-time "sync local data to account" migration.
- Store routes as encoded polylines or PostGIS.

**v3 — Native power**
- Wrap with **Capacitor** for background GPS tracking and real step counting (pedometer / HealthKit / Health Connect).
- Push notifications ("Keep your 6-day streak alive!").

**v4 — Extras**
- Audio cues during runs (Web Speech API: "1 kilometre, pace 5 minutes 40").
- Weekly/monthly goals and challenges, share card image of a run, heart-rate device (Web Bluetooth), friends & leaderboards, water/sleep/weight tracking.

---

## 15. Key Rules to Follow While Building

1. **Components never call localStorage or Dexie directly** — always go through `data/repositories` or `store/`.
2. **All map code stays in `components/map/`** and loads with `ssr: false`.
3. **All math stays in `lib/` as pure, tested functions.**
4. **Dates use local `yyyy-MM-dd` keys** for notes, photos and calendar grouping.
5. **Mobile-first CSS** — design at 390 px width, then add `md:` and `lg:` styles.
6. **Every interactive element is accessible** (label, focus ring, 44 px target).
