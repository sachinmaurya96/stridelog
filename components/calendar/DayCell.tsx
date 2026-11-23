import { format } from 'date-fns';
import { Camera, NotebookPen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DayInfo {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  runs: number;
  walks: number;
  distanceM: number;
  /** 0–4: how much distance compared with the busiest day of the month (heatmap fill). */
  intensity: number;
  hasNote: boolean;
  hasPhoto: boolean;
}

// One hue, light → strong, for the heatmap fill.
const INTENSITY = [
  '',
  'bg-[color-mix(in_oklab,var(--chart-run)_12%,transparent)]',
  'bg-[color-mix(in_oklab,var(--chart-run)_22%,transparent)]',
  'bg-[color-mix(in_oklab,var(--chart-run)_34%,transparent)]',
  'bg-[color-mix(in_oklab,var(--chart-run)_48%,transparent)]',
];

function describe(d: DayInfo) {
  const parts = [format(d.date, 'EEEE d MMMM')];
  if (d.isToday) parts.push('today');
  if (d.runs) parts.push(`${d.runs} ${d.runs === 1 ? 'run' : 'runs'}`);
  if (d.walks) parts.push(`${d.walks} ${d.walks === 1 ? 'walk' : 'walks'}`);
  if (d.hasNote) parts.push('note');
  if (d.hasPhoto) parts.push('photo');
  return parts.join(', ');
}

export function DayCell({ day, onSelect }: { day: DayInfo; onSelect: (d: DayInfo) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      disabled={day.isFuture}
      aria-label={describe(day)}
      aria-current={day.isToday ? 'date' : undefined}
      className={cn(
        'relative flex aspect-square min-h-11 flex-col items-center justify-start gap-1 rounded-xl p-1 pt-1.5 text-sm transition-colors sm:aspect-auto sm:h-20 sm:items-start sm:p-2',
        day.inMonth && INTENSITY[day.intensity],
        (!day.intensity || !day.inMonth) && 'hover:bg-muted/60',
        !day.inMonth && 'text-muted-foreground',
        day.isFuture && 'cursor-default opacity-30',
        day.isToday && 'ring-2 ring-run ring-inset',
      )}
    >
      <span className={cn('leading-none tabular-nums', day.isToday ? 'font-bold' : 'font-medium')}>{format(day.date, 'd')}</span>
      <span className={cn('flex items-center gap-1', !day.inMonth && 'opacity-60')} aria-hidden>
        {day.runs > 0 && <span className="size-2 rounded-full bg-run ring-2 ring-background" />}
        {day.walks > 0 && <span className="size-2 rounded-full bg-walk ring-2 ring-background" />}
      </span>
      {(day.hasNote || day.hasPhoto) && (
        <span className="flex items-center gap-0.5 text-muted-foreground sm:absolute sm:top-2 sm:right-2" aria-hidden>
          {day.hasNote && <NotebookPen className="size-3" />}
          {day.hasPhoto && <Camera className="size-3" />}
        </span>
      )}
    </button>
  );
}
