'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useNote, useNotes } from '@/hooks/useData';
import { dayKey, fromDayKey } from '@/lib/stats';
import { MoodChart } from './MoodChart';
import { NoteEditor } from './NoteEditor';
import { NoteList } from './NoteList';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function NotesView() {
  const params = useSearchParams();
  const today = dayKey(new Date());
  const requested = params.get('date');
  const [date, setDate] = useState(requested && DATE_RE.test(requested) && requested <= today ? requested : today);
  const note = useNote(date);
  const notes = useNotes();

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 py-2 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Card>
        <CardHeader className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-bold">{date === today ? "Today's note" : 'Note'}</CardTitle>
            <p className="text-sm text-muted-foreground">{format(fromDayKey(date), 'EEEE d MMMM yyyy')}</p>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="note-date" className="text-xs text-muted-foreground">
              Date
            </Label>
            <Input
              id="note-date"
              type="date"
              value={date}
              max={today}
              onChange={(e) => DATE_RE.test(e.target.value) && e.target.value <= today && setDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </CardHeader>
        <CardContent>
          {note === undefined ? <Skeleton className="h-96 rounded-2xl" /> : <NoteEditor key={date} date={date} initial={note} />}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {notes && notes.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Mood over time</CardTitle>
            </CardHeader>
            <CardContent>
              <MoodChart notes={notes} />
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            {notes ? <NoteList notes={notes} selected={date} onSelect={setDate} /> : <Skeleton className="h-40 rounded-2xl" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
