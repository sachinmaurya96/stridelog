import type { ActivityType, GeoPoint } from '@/data/types';
import { bearingDeg, distanceM } from './geo';
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

interface SimulationOptions {
  center: LatLng;
  /** Read on every tick, so switching Run/Walk changes the simulated speed. */
  getType: () => ActivityType;
  /** How many simulated seconds pass per real second. */
  speedFactor?: number;
  onPoint: (point: GeoPoint, heading: number | null) => void;
}

export interface Simulation {
  stop: () => void;
  /** Stand still (GPS keeps drifting around you, like a real phone) or carry on moving. */
  setStill: (still: boolean) => void;
}

const gauss = () => Math.sqrt(-2 * Math.log(Math.random() || 1e-9)) * Math.cos(2 * Math.PI * Math.random());

/**
 * Feeds fake GPS fixes along a 2 km loop, one simulated second per tick, into the same pipeline as
 * real GPS. The fixes carry realistic noise: a slowly wandering error, per-fix jitter and the odd
 * multipath spike, so standing still behaves like a real phone (the position keeps drifting).
 */
export function startSimulation({ center, getType, speedFactor = 1, onPoint }: SimulationOptions): Simulation {
  const route = loopRoute(center, 2000);
  const legs = route.slice(1).map((p, i) => distanceM(route[i], p));
  let leg = 0;
  let along = 0;
  let lastT: number | null = null;
  let still = false;
  let ex = 0, ey = 0; // wandering error in meters

  const tick = () => {
    const t = now();
    // Move by the simulated time that actually passed, so timer jitter doesn't fake speed spikes.
    const dtSec = lastT == null ? 1 : Math.min(5, (t - lastT) / 1000);
    lastT = t;
    const type = getType();
    let step = still ? 0 : SIM_SPEED_MPS[type] * (0.92 + Math.random() * 0.16) * dtSec;
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
    ex = 0.9 * ex + 0.44 * 3 * gauss();
    ey = 0.9 * ey + 0.44 * 3 * gauss();
    let nx = ex + 1.2 * gauss();
    let ny = ey + 1.2 * gauss();
    if (Math.random() < 0.02) {
      const ang = Math.random() * 2 * Math.PI, r = 25 + Math.random() * 10;
      nx += r * Math.cos(ang);
      ny += r * Math.sin(ang);
    }
    const lat = a.lat + (b.lat - a.lat) * f;
    const cos = Math.cos((lat * Math.PI) / 180);
    onPoint(
      {
        lat: lat + ny / 111_320,
        lng: a.lng + (b.lng - a.lng) * f + nx / (111_320 * cos),
        t,
        acc: still ? 8 + Math.round(Math.random() * 6) : 4 + Math.round(Math.random() * 4),
        speed: still ? Math.abs(0.08 * gauss()) : SIM_SPEED_MPS[type] * (0.95 + Math.random() * 0.1),
      },
      still ? null : bearingDeg(a, b),
    );
  };

  tick();
  const id = setInterval(tick, 1000 / speedFactor);
  return {
    stop: () => clearInterval(id),
    setStill: (v) => {
      still = v;
    },
  };
}
