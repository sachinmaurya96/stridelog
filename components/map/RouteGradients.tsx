/** SVG gradients referenced by route polylines as `url(#sl-grad-run)` / `url(#sl-grad-walk)`. */
export function RouteGradients() {
  return (
    <svg width="0" height="0" aria-hidden className="pointer-events-none absolute">
      <defs>
        <linearGradient id="sl-grad-run" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff6b35" />
          <stop offset="100%" stopColor="#ff3d71" />
        </linearGradient>
        <linearGradient id="sl-grad-walk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00d4aa" />
          <stop offset="100%" stopColor="#00b4d8" />
        </linearGradient>
      </defs>
    </svg>
  );
}
