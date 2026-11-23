'use client';

import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, useMap } from 'react-leaflet';
import type { ActivityType, GeoPoint } from '@/data/types';
import { boundsOf, toSegments } from '@/lib/geo';
import { cn } from '@/lib/utils';
import { MapResizer, ThemedTiles } from './MapParts';
import { END_COLOR, pinIcon, routeColor, routeStyles, START_COLOR } from './style';

export interface RouteMapProps {
  route: GeoPoint[];
  type: ActivityType;
  /** false = static thumbnail (no zoom, pan or controls). */
  interactive?: boolean;
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
  marker,
  className,
  padding = 24,
}: RouteMapProps) {
  const segments = useMemo(
    () => toSegments(route).map((seg) => seg.map((p) => [p.lat, p.lng] as [number, number])),
    [route],
  );
  const styles = routeStyles(type);
  const icons = useMemo(() => ({ start: pinIcon(START_COLOR), end: pinIcon(END_COLOR) }), []);
  const first = route[0];
  const last = route[route.length - 1];
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
        {first && <Marker position={[first.lat, first.lng]} icon={icons.start} interactive={false} keyboard={false} />}
        {last && route.length > 1 && (
          <Marker position={[last.lat, last.lng]} icon={icons.end} interactive={false} keyboard={false} />
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
