'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Camera, Coffee, NotebookPen } from 'lucide-react';
import type { Activity, Units } from '@/data/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ActivityCard } from '@/components/activities/ActivityCard';
import { moodFor } from '@/components/notes/moods';
import { useNote, usePhotoByDate } from '@/hooks/useData';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { useObjectUrl } from '@/hooks/useObjectUrl';
import { formatDistance } from '@/lib/format';
import { fromDayKey } from '@/lib/stats';

function DayContent({ dateKey, activities, units }: { dateKey: string; activities: Activity[]; units: Units }) {
  const note = useNote(dateKey);
  const photo = usePhotoByDate(dateKey);
  const photoUrl = useObjectUrl(photo?.thumbBlob);
  const total = activities.reduce((s, a) => s + a.distanceM, 0);

  return (
    <div className="flex flex-col gap-5 px-4 pb-6">
      <section aria-labelledby="day-activities" className="flex flex-col gap-2">
        <h3 id="day-activities" className="text-sm font-semibold">
          Activities{activities.length > 0 && <span className="font-normal text-muted-foreground"> · {formatDistance(total, units)}</span>}
        </h3>
        {activities.length ? (
          activities.map((a) => <ActivityCard key={a.id} activity={a} units={units} />)
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Coffee className="size-4" aria-hidden /> Rest day
          </p>
        )}
      </section>

      <section aria-labelledby="day-note" className="flex flex-col gap-2">
        <h3 id="day-note" className="text-sm font-semibold">
          Note
        </h3>
        {note ? (
          <Link href={`/notes?date=${dateKey}`} className="glass flex gap-3 rounded-2xl p-3">
            <span className="text-3xl" role="img" aria-label={`Mood: ${moodFor(note.mood).label}`}>
              {moodFor(note.mood).emoji}
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="line-clamp-3 text-sm">{note.text || <span className="text-muted-foreground">No text</span>}</span>
              {note.tags.length > 0 && <span className="text-xs text-muted-foreground">{note.tags.map((t) => `#${t}`).join(' ')}</span>}
            </span>
          </Link>
        ) : (
          note === null && (
            <Button asChild variant="outline" className="self-start">
              <Link href={`/notes?date=${dateKey}`}>
                <NotebookPen aria-hidden /> Add note
              </Link>
            </Button>
          )
        )}
      </section>

      <section aria-labelledby="day-photo" className="flex flex-col gap-2">
        <h3 id="day-photo" className="text-sm font-semibold">
          Photo
        </h3>
        {photo && photoUrl ? (
          <Link href={`/photos?date=${dateKey}`} className="block w-40 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL */}
            <img src={photoUrl} alt={photo.caption || `Progress photo for ${dateKey}`} className="aspect-[3/4] w-full object-cover" />
          </Link>
        ) : (
          photo === null && (
            <Button asChild variant="outline" className="self-start">
              <Link href={`/photos?date=${dateKey}`}>
                <Camera aria-hidden /> Add photo
              </Link>
            </Button>
          )
        )}
      </section>
    </div>
  );
}

export function DayDetailSheet({
  dateKey,
  activities,
  units,
  onClose,
}: {
  dateKey: string | null;
  activities: Activity[];
  units: Units;
  onClose: () => void;
}) {
  const isDesktop = useIsDesktop();
  return (
    <Sheet open={!!dateKey} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side={isDesktop ? 'right' : 'bottom'} className={isDesktop ? 'w-full overflow-y-auto sm:max-w-md' : 'max-h-[85dvh] overflow-y-auto rounded-t-3xl pb-safe'}>
        {dateKey && (
          <>
            <SheetHeader>
              <SheetTitle className="text-xl font-bold">{format(fromDayKey(dateKey), 'EEEE d MMMM')}</SheetTitle>
              <SheetDescription>{format(fromDayKey(dateKey), 'yyyy')}</SheetDescription>
            </SheetHeader>
            <DayContent dateKey={dateKey} activities={activities} units={units} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
