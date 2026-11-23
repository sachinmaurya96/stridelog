'use client';

import type { Rating } from '@/data/types';
import { cn } from '@/lib/utils';
import { MOODS } from './moods';

export function MoodPicker({ value, onChange }: { value: Rating; onChange: (v: Rating) => void }) {
  return (
    <div role="radiogroup" aria-label="Mood" className="grid grid-cols-5 gap-2">
      {MOODS.map((m) => {
        const checked = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={m.label}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(m.value)}
            onKeyDown={(e) => {
              const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
              if (!delta) return;
              e.preventDefault();
              const next = Math.min(5, Math.max(1, value + delta)) as Rating;
              onChange(next);
              (e.currentTarget.parentElement?.children[next - 1] as HTMLElement | undefined)?.focus();
            }}
            className={cn(
              'flex h-16 flex-col items-center justify-center gap-0.5 rounded-2xl border border-transparent bg-muted/60 transition-all',
              checked ? 'scale-105 border-run bg-background shadow-md' : 'opacity-70 hover:opacity-100',
            )}
          >
            <span className="text-2xl leading-none" aria-hidden>
              {m.emoji}
            </span>
            <span className="text-[11px] text-muted-foreground">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
