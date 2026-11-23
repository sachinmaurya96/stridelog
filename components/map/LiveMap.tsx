'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { Circle, MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { useReducedMotion } from 'motion/react';
import type { ActivityType, GeoPoint } from '@/data/types';
import { cn } from '@/lib/utils';
import type { Fix } from '@/components/tracking/TrackerProvider';
import { MapA11y, MapResizer, ThemedTiles } from './MapParts';
import { RecenterButton } from './RecenterButton';
import { flagIcon, locationIcon, routeStyles, START_COLOR } from './style';

export interface LiveMapProps {
  fix: Fix | null;
  route: GeoPoint[];
  type: ActivityType;
  following: boolean;
  onFollowingChange: (following: boolean) => void;
  className?: string;
  recenterClassName?: string;
  /** Height (px) of UI covering the bottom of the map; the dot is centred in the space above it. */
  bottomInset?: number;
}

/** Centres on the first fix, then follows the user until they drag the map. */
function Follow({
  fix,
  following,
  onUserPan,
  bottomInset,
}: {
  fix: Fix | null;
  following: boolean;
  onUserPan: () => void;
  bottomInset: number;
}) {
  const map = useMap();
  const reduceMotion = useReducedMotion();
  const centered = useRef(false);
  const wasFollowing = useRef(following);
  const onUserPanRef = useRef(onUserPan);
  useEffect(() => {
    onUserPanRef.current = onUserPan;
  });
  useMapEvents({ dragstart: () => onUserPanRef.current() });

  const lat = fix?.point.lat;
  const lng = fix?.point.lng;
  useEffect(() => {
    if (lat == null || lng == null) return;
    // Map centre that puts the dot in the middle of the visible area above the stats panel.
    const centreFor = (zoom: number) =>
      bottomInset > 0 ? map.unproject(map.project([lat, lng], zoom).add([0, bottomInset / 2]), zoom) : L.latLng(lat, lng);
    if (!centered.current) {
      centered.current = true;
      map.setView(centreFor(17), 17, { animate: false });
    } else if (following && !wasFollowing.current) {
      const zoom = Math.max(map.getZoom(), 16);
      map.setView(centreFor(zoom), zoom, { animate: !reduceMotion });
    } else if (following) {
      map.panTo(centreFor(map.getZoom()), { animate: !reduceMotion, duration: 0.6 });
    }
    wasFollowing.current = following;
  }, [lat, lng, following, map, reduceMotion, bottomInset]);
  return null;
}

/** Pulsing blue dot + accuracy circle + heading arrow. */
function LocationMarker({ fix }: { fix: Fix }) {
  const markerRef = useRef<L.Marker>(null);
  const icon = useMemo(() => locationIcon(), []);
  const { lat, lng, acc } = fix.point;

  // Rotate the arrow in place so the pulse animation isn't restarted on every fix.
  useEffect(() => {
    const el = markerRef.current?.getElement()?.querySelector<HTMLElement>('.sl-location__heading');
    if (!el) return;
    el.style.display = fix.heading == null ? 'none' : '';
    if (fix.heading != null) el.style.transform = `rotate(${fix.heading}deg)`;
  }, [fix.heading]);

  return (
    <>
      <Circle
        center={[lat, lng]}
        radius={acc}
        interactive={false}
        pathOptions={{ color: '#2f80ff', weight: 1, opacity: 0.5, fillColor: '#2f80ff', fillOpacity: 0.12 }}
      />
      <Marker ref={markerRef} position={[lat, lng]} icon={icon} interactive={false} keyboard={false} zIndexOffset={1000} />
    </>
  );
}

/**
 * Draws the live route by appending new points to existing polylines (no full re-render),
 * with one polyline set per pause-separated segment.
 */
function LiveRoute({ route, type }: { route: GeoPoint[]; type: ActivityType }) {
  const map = useMap();
  const layers = useRef(new Map<number, L.Polyline[]>());
  const drawn = useRef(0);
  const lastDrawn = useRef<GeoPoint | null>(null);

  useEffect(() => {
    // Points can be removed (GPS drift dropped after a stop): then redraw from scratch.
    if (route.length < drawn.current || (drawn.current > 0 && route[drawn.current - 1] !== lastDrawn.current)) {
      layers.current.forEach((ls) => ls.forEach((l) => l.remove()));
      layers.current.clear();
      drawn.current = 0;
    }
    for (let i = drawn.current; i < route.length; i++) {
      const p = route[i];
      const seg = p.seg ?? 0;
      let ls = layers.current.get(seg);
      if (!ls) {
        ls = routeStyles(type).map((o) => L.polyline([], o).addTo(map));
        layers.current.set(seg, ls);
      }
      for (const l of ls) l.addLatLng([p.lat, p.lng]);
    }
    drawn.current = route.length;
    lastDrawn.current = route[route.length - 1] ?? null;
  }, [route, type, map]);

  useEffect(() => {
    const styles = routeStyles(type);
    layers.current.forEach((ls) => ls.forEach((l, i) => l.setStyle(styles[i])));
  }, [type]);

  useEffect(() => {
    const current = layers.current;
    return () => {
      current.forEach((ls) => ls.forEach((l) => l.remove()));
      current.clear();
      drawn.current = 0;
    };
  }, [map]);

  return null;
}

export default function LiveMap({
  fix,
  route,
  type,
  following,
  onFollowingChange,
  className,
  recenterClassName,
  bottomInset = 0,
}: LiveMapProps) {
  const startIcon = useMemo(() => flagIcon('Start', START_COLOR), []);
  const reduceMotion = useReducedMotion();
  const start = route[0];

  return (
    <div className={cn('relative isolate overflow-hidden', className)}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        zoomControl={false}
        zoomAnimation={!reduceMotion}
        fadeAnimation={!reduceMotion}
        markerZoomAnimation={!reduceMotion}
        className="size-full"
      >
        <MapA11y label="Live map of your location and route" />
        <ThemedTiles />
        <MapResizer />
        <Follow fix={fix} following={following} onUserPan={() => onFollowingChange(false)} bottomInset={bottomInset} />
        <LiveRoute route={route} type={type} />
        {start && <Marker position={[start.lat, start.lng]} icon={startIcon} interactive={false} keyboard={false} />}
        {fix && <LocationMarker fix={fix} />}
      </MapContainer>
      {fix && !following && (
        <RecenterButton onClick={() => onFollowingChange(true)} className={recenterClassName ?? 'top-3 right-3'} />
      )}
    </div>
  );
}
