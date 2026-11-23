import { TILES } from './tiles';

/** Page-level map credit, used where map thumbnails are too small for Leaflet's own attribution. */
export function MapAttribution() {
  return (
    <p
      className="text-xs text-muted-foreground [&_a]:underline"
      // Static, trusted HTML from our own tile config.
      dangerouslySetInnerHTML={{ __html: `Maps ${TILES.light.attribution}` }}
    />
  );
}
