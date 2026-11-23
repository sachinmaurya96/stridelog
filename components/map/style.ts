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
