import type { ActivityType, Units } from '@/data/types';

export const M_PER_MI = 1609.344;

const pad = (n: number) => String(n).padStart(2, '0');

/** 3932 → "1:05:32", 332 → "5:32". */
export function formatDuration(sec: number) {
  const s = Math.max(0, Math.floor(Number.isFinite(sec) ? sec : 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`;
}

/** 3932 → "1h 05m", 1500 → "25m", 40 → "40s". */
export function formatDurationShort(sec: number) {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${pad(m)}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

/** Pace value without the unit: 342 → `5'42"`. */
export function formatPaceValue(secPerKm: number, units: Units = 'km') {
  if (!Number.isFinite(secPerKm) || secPerKm <= 0 || secPerKm > 3600) return `--'--"`;
  const sec = Math.round(units === 'mi' ? secPerKm * (M_PER_MI / 1000) : secPerKm);
  return `${Math.floor(sec / 60)}'${pad(sec % 60)}"`;
}

/** 342 → `5'42"/km` (or per mile). */
export function formatPace(secPerKm: number, units: Units = 'km') {
  return `${formatPaceValue(secPerKm, units)}/${units}`;
}

/** Distance as a number in the user's unit. */
export function distanceValue(m: number, units: Units = 'km') {
  return units === 'mi' ? m / M_PER_MI : m / 1000;
}

/** 5230 → "5.23 km" / "3.25 mi". */
export function formatDistance(m: number, units: Units = 'km', decimals = 2) {
  return `${distanceValue(m, units).toFixed(decimals)} ${units}`;
}

export function formatSpeed(mps: number, units: Units = 'km') {
  const v = units === 'mi' ? (mps * 3600) / M_PER_MI : mps * 3.6;
  return `${v.toFixed(1)} ${units === 'mi' ? 'mph' : 'km/h'}`;
}

/** Converts a distance typed in the user's unit back to meters. */
export function toMeters(value: number, units: Units = 'km') {
  return units === 'mi' ? value * M_PER_MI : value * 1000;
}

export function formatNumber(n: number, maxDecimals = 0) {
  return n.toLocaleString(undefined, { maximumFractionDigits: maxDecimals });
}

/** "Morning Run", "Evening Walk"… from the local start time. */
export function activityTitle(type: ActivityType, startedAt: number) {
  const h = new Date(startedAt).getHours();
  const part =
    h >= 5 && h < 11 ? 'Morning'
    : h >= 11 && h < 14 ? 'Lunch'
    : h >= 14 && h < 17 ? 'Afternoon'
    : h >= 17 && h < 21 ? 'Evening'
    : 'Night';
  return `${part} ${type === 'run' ? 'Run' : 'Walk'}`;
}
