'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface HoldButtonProps {
  onComplete: () => void;
  label: string;
  durationMs?: number;
  className?: string;
  children: React.ReactNode;
}

/** A button that only fires after being held down (mouse, touch, Enter or Space) for `durationMs`. */
export function HoldButton({ onComplete, label, durationMs = 1500, className, children }: HoldButtonProps) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);
  const startedAt = useRef<number | null>(null);

  const cancel = () => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
    raf.current = null;
    startedAt.current = null;
    setProgress(0);
  };

  const begin = () => {
    if (startedAt.current != null) return;
    startedAt.current = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - (startedAt.current ?? t)) / durationMs);
      setProgress(p);
      if (p >= 1) {
        cancel();
        onComplete();
      } else {
        raf.current = requestAnimationFrame(step);
      }
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => () => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
  }, []);

  const r = 46;
  const c = 2 * Math.PI * r;

  return (
    <button
      type="button"
      aria-label={label}
      className={cn('relative touch-none select-none', className)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        begin();
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onLostPointerCapture={cancel}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
          e.preventDefault();
          begin();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === 'Enter' || e.key === ' ') cancel();
      }}
      onBlur={cancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute -inset-1.5 size-[calc(100%+0.75rem)] -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth="4" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
        />
      </svg>
      {children}
    </button>
  );
}
