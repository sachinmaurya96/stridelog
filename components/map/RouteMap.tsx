'use client';

import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, useMap } from 'react-leaflet';
import type { ActivityType, GeoPoint } from '@/data/types';
import { boundsOf, directionMarkers, distanceM, toSegments } from '@/lib/geo';
import { cn } from '@/lib/utils';
import { MapResizer, ThemedTiles } from './MapParts';
import { arrowIcon, END_COLOR, flagIcon, pinIcon, routeColor, routeStyles, START_COLOR } from './style';

export interface RouteMapProps {
  route: GeoPoint[];
  type: ActivityType;
  /** false = static thumbnail (no zoom, pan or controls). */
  interactive?: boolean;
  /** Labelled Start/Finish pins and direction arrows (defaults to `interactive`; thumbnails use plain dots). */
  labels?: boolean;
  /** Show Leaflet's attribution (defaults to `interactive`; tiny thumbnails credit the map once per page). */
  attribution?: boolean;
  /** Position of the replay marker, if any. */
  marker?: { lat: number; lng: number } | null;
  className?: string;
  padding?: number;
}

function FitBounds({ route, padding }: { route: GeoPoint[]; padding: number }) {
  const map = useMap();
  const fit = useCallback(() => {
    const b = boundsOf(route);
    if (b) map.fitBounds(b, { padding: [padding, padding], maxZoom: 17, animate: false });
  }, [map, route, padding]);
  useEffect(fit, [fit]);
  return <MapResizer onResize={fit} />;
}

export default function RouteMap({
  route,
  type,
  interactive = true,
  attribution = interactive,
  labels = interactive,
  marker,
  className,
  padding = 24,
}: RouteMapProps) {
  const segments = useMemo(
    () => toSegments(route).map((seg) => seg.map((p) => [p.lat, p.lng] as [number, number])),
    [route],
  );
  const styles = routeStyles(type);
  const first = route[0];
  const last = route[route.length - 1];
  const icons = useMemo(() => {
    if (!labels) return { start: pinIcon(START_COLOR), end: pinIcon(END_COLOR) };
    const loop = first && last && distanceM(first, last) < 40;
    return { start: flagIcon('Start', START_COLOR), end: flagIcon('Finish', END_COLOR, !!loop) };
  }, [labels, first, last]);
  const arrows = useMemo(() => (labels ? directionMarkers(route, 6) : []), [labels, route]);
  const center: [number, number] = first ? [first.lat, first.lng] : [20, 0];

  return (
    <div className={cn('relative isolate overflow-hidden', !interactive && 'sl-thumb', className)}>
      <MapContainer
        center={center}
        zoom={first ? 15 : 2}
        className="size-full"
        zoomControl={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={interactive}
        attributionControl={attribution}
        aria-label={interactive ? 'Route map' : undefined}
        aria-hidden={interactive ? undefined : true}
      >
        <ThemedTiles />
        <FitBounds route={route} padding={padding} />
        {segments.map((positions, i) =>
          styles.map((pathOptions, j) => <Polyline key={`${i}-${j}`} positions={positions} pathOptions={pathOptions} />),
        )}
        {arrows.map((a, i) => (
          <Marker key={i} position={[a.lat, a.lng]} icon={arrowIcon(a.bearing)} interactive={false} keyboard={false} />
        ))}
        {first && <Marker position={[first.lat, first.lng]} icon={icons.start} interactive={false} keyboard={false} zIndexOffset={500} />}
        {last && route.length > 1 && (
          <Marker position={[last.lat, last.lng]} icon={icons.end} interactive={false} keyboard={false} zIndexOffset={600} />
        )}
        {marker && (
          <CircleMarker
            center={[marker.lat, marker.lng]}
            radius={8}
            interactive={false}
            pathOptions={{ color: '#ffffff', weight: 3, fillColor: routeColor(type), fillOpacity: 1 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
