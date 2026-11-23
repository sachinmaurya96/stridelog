'use client';

import { useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TILES } from './tiles';

/** Dark tiles in dark mode, light tiles in light mode (see TILES for the provider). */
export function ThemedTiles() {
  const { resolved } = useAppTheme();
  const t = TILES[resolved];
  return (
    <TileLayer
      key={resolved}
      url={t.url}
      attribution={t.attribution}
      maxZoom={t.maxZoom}
      maxNativeZoom={t.maxZoom}
      className={t.className}
      // CORS tiles (both providers allow it) so the service worker can cache real responses, not opaque ones.
      crossOrigin="anonymous"
    />
  );
}

/**
 * react-leaflet doesn't pass ARIA props to the map element, so set them here:
 * interactive maps become a named region; decorative thumbnails are hidden from screen readers.
 */
export function MapA11y({ label, decorative }: { label?: string; decorative?: boolean }) {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    if (decorative) {
      el.setAttribute('aria-hidden', 'true');
      el.removeAttribute('tabindex');
    } else {
      el.setAttribute('role', 'region');
      el.setAttribute('aria-roledescription', 'map');
      el.setAttribute('aria-label', label ?? 'Map');
    }
  }, [map, label, decorative]);
  return null;
}

/** Keeps Leaflet's size in sync with its container (sheets, panels and rotation change it). */
export function MapResizer({ onResize }: { onResize?: () => void }) {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
      onResize?.();
    });
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map, onResize]);
  return null;
}
