'use client';

import { useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TILES } from './style';

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
    />
  );
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
