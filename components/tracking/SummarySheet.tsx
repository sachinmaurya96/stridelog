'use client';

import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { Loader2, Save, Trash2 } from 'lucide-react';
import type { ActivityType, GeoPoint, Split, Units } from '@/data/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ACTIVITY_META } from '@/components/common/activity';
import { RouteMap } from '@/components/map/MapClient';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import type { LiveStats } from '@/hooks/useTracker';
import { activityTitle, formatDistance, formatDuration, formatNumber, formatPace, formatSpeed } from '@/lib/format';
import { cn } from '@/lib/utils';
import { SplitsList } from './SplitsList';

interface SummarySheetProps {
  open: boolean;
  type: ActivityType;
  startedAt: number;
  route: GeoPoint[];
  stats: LiveStats;
  splits: Split[];
  units: Units;
  onSave: (title: string) => Promise<void>;
  onDiscard: () => void;
  onBack: () => void;
}

export function SummarySheet({ open, type, startedAt, route, stats, splits, units, onSave, onDiscard, onBack }: SummarySheetProps) {
  const isDesktop = useIsDesktop();
  const [title, setTitle] = useState(() => activityTitle(type, startedAt));
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const saveRef = useRef<HTMLButtonElement>(null);
  const meta = ACTIVITY_META[type];

  const items = [
    ['Distance', formatDistance(stats.distanceM, units)],
    ['Time', formatDuration(stats.movingSec)],
    ['Avg pace', formatPace(stats.avgPace, units)],
    ['Calories', `${formatNumber(stats.calories)} kcal`],
    ['Est. steps', formatNumber(stats.steps)],
    ['Max speed', formatSpeed(stats.maxSpeedMps, units)],
  ];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !saving && onBack()}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        onOpenAutoFocus={(e) => {
          // Focus Save rather than the title field, so the phone keyboard doesn't pop up.
          e.preventDefault();
          saveRef.current?.focus();
        }}
        className={cn('flex max-h-[92dvh] flex-col gap-0 overflow-y-auto', isDesktop ? 'w-full sm:max-w-md' : 'rounded-t-3xl')}
      >
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">Nice {meta.label.toLowerCase()}! 🎉</SheetTitle>
          <SheetDescription>{format(startedAt, "EEEE d MMMM 'at' HH:mm")}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          {route.length > 1 ? (
            <RouteMap route={route} type={type} interactive={false} attribution labels className="h-48 rounded-2xl" />
          ) : (
            <div className="grid h-24 place-items-center rounded-2xl bg-muted text-sm text-muted-foreground">
              No GPS route was recorded
            </div>
          )}

          <dl className="grid grid-cols-3 gap-2">
            {items.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-muted/60 px-3 py-2">
                <dt className="text-[11px] text-muted-foreground">{label}</dt>
                <dd className="font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="summary-splits">
            <h3 id="summary-splits" className="mb-2 text-sm font-semibold">
              Splits
            </h3>
            <SplitsList splits={splits} units={units} />
          </section>

          <div className="flex flex-col gap-2">
            <Label htmlFor="activity-title">Title</Label>
            <Input id="activity-title" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>

        <SheetFooter className="sticky bottom-0 mt-auto flex-row gap-3 border-t bg-popover pb-safe">
          <Button variant="outline" size="lg" onClick={() => setConfirmDiscard(true)} disabled={saving}>
            <Trash2 aria-hidden /> Discard
          </Button>
          <Button
            ref={saveRef}
            size="lg"
            className={cn('flex-1 text-ink-on-accent hover:opacity-90', meta.gradient)}
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(title);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Save {meta.label.toLowerCase()}
          </Button>
        </SheetFooter>

        <ConfirmDialog
          open={confirmDiscard}
          onOpenChange={setConfirmDiscard}
          title={`Discard this ${meta.label.toLowerCase()}?`}
          description="The route and stats will be deleted. This can't be undone."
          confirmLabel="Discard"
          destructive
          onConfirm={onDiscard}
        />
      </SheetContent>
    </Sheet>
  );
}
