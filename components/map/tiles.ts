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
