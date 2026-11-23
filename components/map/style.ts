import L from 'leaflet';
import type { PathOptions } from 'leaflet';
import type { ActivityType } from '@/data/types';

export { TILES } from './tiles';

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

/** Pin with a "Start" / "Finish" label. `below` puts the label under the pin (when start and finish overlap). */
export const flagIcon = (label: string, color: string, below = false) =>
  L.divIcon({
    className: 'sl-marker',
    html: `<div class="sl-flag${below ? ' sl-flag--below' : ''}" style="--c:${color}"><span class="sl-flag__label">${label}</span><span class="sl-flag__pin"></span></div>`,
    iconSize: [72, 48],
    iconAnchor: below ? [36, 8] : [36, 40],
  });

/** Small chevron showing the direction of travel. */
export const arrowIcon = (bearing: number) =>
  L.divIcon({
    className: 'sl-marker',
    html: `<div class="sl-arrow" style="transform:rotate(${Math.round(bearing)}deg)"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
