import type { ActivityType, GeoPoint } from '@/data/types';
import { distanceM } from './geo';
import { now } from './clock';

type LatLng = { lat: number; lng: number };

/** Cubbon Park, Bengaluru: used when there is no real GPS fix to start from. */
export const DEFAULT_SIM_CENTER: LatLng = { lat: 12.9763, lng: 77.5929 };

export const SIM_SPEED_MPS: Record<ActivityType, number> = { run: 3.2, walk: 1.4 };

const M_PER_DEG_LAT = 111_320;

/** A closed, slightly irregular loop of roughly `lengthM` meters around `center`. */
export function loopRoute(center: LatLng, lengthM = 2000, n = 240): LatLng[] {
  const cosLat = Math.cos((center.lat * Math.PI) / 180);
  const shape = (scaleM: number) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = (i / n) * 2 * Math.PI;
      const r = scaleM * (1 + 0.18 * Math.sin(3 * a) + 0.07 * Math.cos(5 * a));
      return {
        lat: center.lat + (r * Math.sin(a)) / M_PER_DEG_LAT,
        lng: center.lng + (r * (Math.cos(a) - 1)) / (M_PER_DEG_LAT * cosLat),
      };
    });
  const unit = shape(100);
  let len = 0;
  for (let i = 1; i < unit.length; i++) len += distanceM(unit[i - 1], unit[i]);
  return shape((100 * lengthM) / len);
}

function bearing(a: LatLng, b: LatLng) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

interface SimulationOptions {
  center: LatLng;
  /** Read on every tick, so switching Run/Walk changes the simulated speed. */
  getType: () => ActivityType;
  /** How many simulated seconds pass per real second. */
  speedFactor?: number;
  onPoint: (point: GeoPoint, heading: number) => void;
}

/**
 * Feeds fake GPS fixes along a 2 km loop, one simulated second per tick, into the same
 * pipeline as real GPS. Returns a stop function.
 */
export function startSimulation({ center, getType, speedFactor = 1, onPoint }: SimulationOptions) {
  const route = loopRoute(center, 2000);
  const legs = route.slice(1).map((p, i) => distanceM(route[i], p));
  let leg = 0;
  let along = 0;
  let lastT: number | null = null;

  const tick = () => {
    const t = now();
    // Move by the simulated time that actually passed, so timer jitter doesn't fake speed spikes.
    const dtSec = lastT == null ? 1 : Math.min(5, (t - lastT) / 1000);
    lastT = t;
    const type = getType();
    let step = SIM_SPEED_MPS[type] * (0.92 + Math.random() * 0.16) * dtSec;
    while (step > 0) {
      const left = legs[leg] - along;
      if (step < left) {
        along += step;
        step = 0;
      } else {
        step -= left;
        along = 0;
        leg = (leg + 1) % legs.length;
      }
    }
    const a = route[leg], b = route[leg + 1];
    const f = legs[leg] ? along / legs[leg] : 0;
    const jitter = () => (Math.random() - 0.5) * 0.000012; // ~±0.7 m
    onPoint(
      {
        lat: a.lat + (b.lat - a.lat) * f + jitter(),
        lng: a.lng + (b.lng - a.lng) * f + jitter(),
        t,
        acc: 4 + Math.round(Math.random() * 4),
        speed: SIM_SPEED_MPS[type],
      },
      bearing(a, b),
    );
  };

  tick();
  const id = setInterval(tick, 1000 / speedFactor);
  return () => clearInterval(id);
}
