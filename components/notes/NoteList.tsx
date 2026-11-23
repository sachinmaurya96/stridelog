'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import type { DailyNote } from '@/data/types';
import { Input } from '@/components/ui/input';
import { fromDayKey } from '@/lib/stats';
import { cn } from '@/lib/utils';
import { moodFor } from './moods';

export function NoteList({ notes, selected, onSelect }: { notes: DailyNote[]; selected: string; onSelect: (date: string) => void }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, '');
    if (!q) return notes;
    return notes.filter((n) => n.text.toLowerCase().includes(q) || n.tags.some((t) => t.includes(q)) || moodFor(n.mood).label.toLowerCase() === q);
  }, [notes, query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes and #tags"
          aria-label="Search notes"
          className="pl-9"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{notes.length ? 'No notes match your search.' : 'No notes yet.'}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((n) => {
            const mood = moodFor(n.mood);
            return (
              <li key={n.date}>
                <button
                  type="button"
                  onClick={() => onSelect(n.date)}
                  aria-current={n.date === selected ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-2xl border border-transparent p-3 text-left transition-colors hover:bg-muted/60',
                    n.date === selected && 'border-run bg-muted/60',
                  )}
                >
                  <span className="text-2xl leading-none" role="img" aria-label={`Mood: ${mood.label}`}>
                    {mood.emoji}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold">{format(fromDayKey(n.date), 'EEE d MMM yyyy')}</span>
                    <span className="line-clamp-2 text-sm text-muted-foreground">{n.text || 'No text'}</span>
                    {n.tags.length > 0 && <span className="truncate text-xs text-muted-foreground">{n.tags.map((t) => `#${t}`).join(' ')}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
