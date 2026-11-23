'use client';

import { format } from 'date-fns';
import type { DailyPhoto } from '@/data/types';
import { useObjectUrl } from '@/hooks/useObjectUrl';
import { fromDayKey } from '@/lib/stats';

function Thumb({ photo, onOpen }: { photo: DailyPhoto; onOpen: () => void }) {
  const url = useObjectUrl(photo.thumbBlob);
  const label = format(fromDayKey(photo.date), 'EEE d MMM');
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${label}: open progress photo from ${format(fromDayKey(photo.date), 'd MMMM yyyy')}`}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted"
    >
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- local blob URL
        <img src={url} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
      )}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pt-6 pb-1.5 text-left text-xs font-medium text-white">
        {label}
      </span>
    </button>
  );
}

/** Thumbnails grouped by month: 2 columns on phones up to 5 on desktop. */
export function PhotoGrid({ photos, onOpen }: { photos: DailyPhoto[]; onOpen: (index: number) => void }) {
  const groups: { month: string; items: { photo: DailyPhoto; index: number }[] }[] = [];
  photos.forEach((photo, index) => {
    const month = format(fromDayKey(photo.date), 'MMMM yyyy');
    const g = groups[groups.length - 1];
    if (g?.month === month) g.items.push({ photo, index });
    else groups.push({ month, items: [{ photo, index }] });
  });

  return (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <section key={g.month} aria-label={g.month} className="flex flex-col gap-3">
          <h2 className="font-semibold">
            {g.month} <span className="text-sm font-normal text-muted-foreground">· {g.items.length}</span>
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {g.items.map(({ photo, index }) => (
              <Thumb key={photo.id} photo={photo} onOpen={() => onOpen(index)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
