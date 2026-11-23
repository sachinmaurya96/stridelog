/** A winding route over rolling hills, with a start pin and a little sun. */
export function EmptyIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 180" className={className} role="img" aria-label="A winding path through hills">
      <defs>
        <linearGradient id="ei-route" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--walk)" />
          <stop offset="100%" stopColor="var(--run-2)" />
        </linearGradient>
        <linearGradient id="ei-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="100%" stopColor="var(--gold)" />
        </linearGradient>
      </defs>
      <circle cx="250" cy="48" r="22" fill="url(#ei-sun)" opacity="0.9" />
      <path d="M0 140 Q60 100 120 128 T240 120 T320 112 V180 H0 Z" fill="var(--muted)" />
      <path d="M0 158 Q80 132 160 152 T320 146 V180 H0 Z" fill="var(--secondary)" opacity="0.9" />
      <path
        d="M30 160 C80 150 70 118 120 116 S170 140 200 118 S250 82 282 92"
        fill="none"
        stroke="url(#ei-route)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="2 12"
      />
      <circle cx="30" cy="160" r="7" fill="var(--walk)" stroke="var(--background)" strokeWidth="3" />
      <path d="M282 72 c-8 0 -14 6 -14 14 c0 10 14 22 14 22 s14 -12 14 -22 c0 -8 -6 -14 -14 -14 z" fill="var(--run)" />
      <circle cx="282" cy="86" r="5" fill="var(--background)" />
    </svg>
  );
}
