'use client';

import Link from 'next/link';
import { Camera, ChevronRight, NotebookPen } from 'lucide-react';
import { moodFor } from '@/components/notes/moods';
import { useNote, usePhotoByDate } from '@/hooks/useData';
import { useObjectUrl } from '@/hooks/useObjectUrl';

/** "Add today's note" / "Add today's photo", or a preview when they exist. */
export function TodayShortcuts({ today }: { today: string }) {
  const note = useNote(today);
  const photo = usePhotoByDate(today);
  const thumb = useObjectUrl(photo?.thumbBlob);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link href="/notes" className="glass group flex items-center gap-4 rounded-2xl p-4 transition-transform hover:-translate-y-0.5">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-muted text-3xl">
          {note ? moodFor(note.mood).emoji : <NotebookPen className="size-6 text-muted-foreground" aria-hidden />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">{note ? "Today's note" : "Add today's note"}</span>
          <span className="truncate text-sm text-muted-foreground">
            {note ? note.text || `Feeling ${moodFor(note.mood).label.toLowerCase()}` : 'How do you feel today?'}
          </span>
        </span>
        <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
      </Link>
      <Link href="/photos" className="glass group flex items-center gap-4 rounded-2xl p-4 transition-transform hover:-translate-y-0.5">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-muted">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob URL
            <img src={thumb} alt="" className="size-full object-cover" />
          ) : (
            <Camera className="size-6 text-muted-foreground" aria-hidden />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">{photo ? "Today's photo" : "Add today's photo"}</span>
          <span className="truncate text-sm text-muted-foreground">
            {photo ? photo.caption || 'Progress photo saved' : 'Track your progress visually'}
          </span>
        </span>
        <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
      </Link>
    </div>
  );
}
