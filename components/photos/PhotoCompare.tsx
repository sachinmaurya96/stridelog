'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { MoveHorizontal } from 'lucide-react';
import type { DailyPhoto } from '@/data/types';
import { Label } from '@/components/ui/label';
import { useObjectUrl } from '@/hooks/useObjectUrl';
import { fromDayKey } from '@/lib/stats';

const nice = (date: string) => format(fromDayKey(date), 'd MMM yyyy');

function DateSelect({ id, label, photos, value, onChange }: { id: string; label: string; photos: DailyPhoto[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm dark:bg-input/30"
      >
        {photos.map((p) => (
          <option key={p.id} value={p.id} className="bg-popover text-popover-foreground">
            {nice(p.date)}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Before/after: drag the handle (or use the arrow keys) to reveal the earlier photo. */
export function PhotoCompare({ photos }: { photos: DailyPhoto[] }) {
  const [beforeId, setBeforeId] = useState(photos[photos.length - 1].id);
  const [afterId, setAfterId] = useState(photos[0].id);
  const [pos, setPos] = useState(50);
  const before = photos.find((p) => p.id === beforeId) ?? photos[photos.length - 1];
  const after = photos.find((p) => p.id === afterId) ?? photos[0];
  const beforeUrl = useObjectUrl(before.blob);
  const afterUrl = useObjectUrl(after.blob);

  return (
    <section aria-labelledby="compare-title" className="glass flex flex-col gap-4 rounded-2xl p-5">
      <h2 id="compare-title" className="text-lg font-bold">
        Before &amp; after
      </h2>
      <div className="flex gap-3">
        <DateSelect id="compare-before" label="Before" photos={photos} value={before.id} onChange={setBeforeId} />
        <DateSelect id="compare-after" label="After" photos={photos} value={after.id} onChange={setAfterId} />
      </div>
      <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl bg-muted select-none">
        {afterUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob URL
          <img src={afterUrl} alt={`After: ${nice(after.date)}`} className="absolute inset-0 size-full object-cover" draggable={false} />
        )}
        {beforeUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob URL
          <img
            src={beforeUrl}
            alt={`Before: ${nice(before.date)}`}
            className="absolute inset-0 size-full object-cover"
            style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
            draggable={false}
          />
        )}
        <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">Before · {nice(before.date)}</span>
        <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">After · {nice(after.date)}</span>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow" style={{ left: `${pos}%` }} aria-hidden>
          <span className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-black shadow-lg">
            <MoveHorizontal className="size-5" />
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Reveal the before photo"
          className="absolute inset-0 size-full cursor-ew-resize opacity-0"
        />
      </div>
    </section>
  );
}
