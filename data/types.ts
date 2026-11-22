export type ActivityType = 'run' | 'walk';

export interface GeoPoint {
  lat: number;
  lng: number;
  t: number;        // timestamp (ms)
  acc: number;      // accuracy (meters)
  alt?: number | null;
  speed?: number | null; // m/s from device if available
  seg?: number;     // segment index: increments after every pause so the route isn't joined across gaps
}

export interface Split {
  km: number;
  paceSecPerKm: number;
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
  splits: Split[];
  title?: string;        // e.g. "Morning Run"
  createdAt: number;
}

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface DailyNote {
  date: string;          // 'yyyy-MM-dd' (one per day)
  mood: Rating;
  energy: Rating;
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

export type Units = 'km' | 'mi';
export type ThemePref = 'dark' | 'light' | 'system';

export interface Settings {
  name: string;
  weightKg: number;
  heightCm: number;
  units: Units;
  dailyGoalSteps: number;      // e.g. 8000
  weeklyGoalActivities: number; // e.g. 4
  weeklyGoalKm: number;        // e.g. 20
  theme: ThemePref;
  onboarded: boolean;
}

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface BadgeContext {
  activities: Activity[];
  totals: {
    count: number;
    runs: number;
    walks: number;
    distanceM: number;
  };
  currentStreak: number;
  longestStreak: number;
  notesCount: number;
  photosCount: number;
}

export interface BadgeProgress {
  current: number;
  target: number;
  label: string;         // e.g. "7.4 / 10 km"
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;          // lucide icon name or /icons/badges/*.svg
  tier: BadgeTier;
  check: (ctx: BadgeContext) => boolean;
  progress?: (ctx: BadgeContext) => BadgeProgress;
}

export interface UnlockedBadge { id: string; unlockedAt: number; activityId?: string }
