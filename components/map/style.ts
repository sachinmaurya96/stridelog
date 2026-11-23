import L from 'leaflet';
import type { PathOptions } from 'leaflet';
import type { ActivityType } from '@/data/types';

export interface TileSource {
  url: string;
  attribution: string;
  maxZoom: number;
  /** Extra class on the tile layer (used to darken OSM tiles in dark mode). */
  className?: string;
}

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const STADIA_KEY = process.env.NEXT_PUBLIC_STADIA_API_KEY;

// CARTO's basemaps (the original choice) now answer every request with an "API key required"
// tile, so by default we use the standard OpenStreetMap tiles (no key, attribution required,
// fair use only) and darken them with a CSS filter. Set NEXT_PUBLIC_STADIA_API_KEY to use
// Stadia's purpose-made dark/light styles instead, which is the better choice for a public launch.
export const TILES: Record<'dark' | 'light', TileSource> = STADIA_KEY
  ? {
      dark: {
        url: `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${STADIA_KEY}`,
        attribution: `&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> ${OSM_ATTRIBUTION}`,
        maxZoom: 20,
      },
      light: {
        url: `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${STADIA_KEY}`,
        attribution: `&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> ${OSM_ATTRIBUTION}`,
        maxZoom: 20,
      },
    }
  : {
      dark: {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: OSM_ATTRIBUTION,
        maxZoom: 19,
        className: 'sl-tiles-dark',
      },
      light: {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: OSM_ATTRIBUTION,
        maxZoom: 19,
      },
    };

const SOLID: Record<ActivityType, string> = { run: '#ff6b35', walk: '#00d4aa' };

/** Glow + solid line + gradient line (the gradient lives in <RouteGradients/>). */
export function routeStyles(type: ActivityType): PathOptions[] {
  const common: PathOptions = { lineCap: 'round', lineJoin: 'round', interactive: false };
  return [
    { ...common, color: SOLID[type], weight: 12, opacity: 0.22 },
    { ...common, color: SOLID[type], weight: 5, opacity: 1 },
    { ...common, color: `url(#sl-grad-${type})`, weight: 5, opacity: 1 },
  ];
}

export const routeColor = (type: ActivityType) => SOLID[type];

export const locationIcon = () =>
  L.divIcon({
    className: 'sl-marker',
    html: '<div class="sl-location"><div class="sl-location__pulse"></div><div class="sl-location__heading" style="display:none"></div><div class="sl-location__dot"></div></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

export const pinIcon = (color: string) =>
  L.divIcon({
    className: 'sl-marker',
    html: `<span class="sl-pin" style="display:block;background:${color}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

export const START_COLOR = '#22c55e';
export const END_COLOR = '#ef4444';
