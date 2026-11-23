'use client';

import { Pause, Play, Square } from 'lucide-react';
import type { ActivityType } from '@/data/types';
import { ACTIVITY_META } from '@/components/common/activity';
import { cn } from '@/lib/utils';
import { HoldButton } from './HoldButton';

interface TrackControlsProps {
  status: 'tracking' | 'paused';
  type: ActivityType;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function TrackControls({ status, type, onPause, onResume, onStop }: TrackControlsProps) {
  const paused = status === 'paused';
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-8">
        <button
          type="button"
          onClick={paused ? onResume : onPause}
          aria-label={paused ? 'Resume' : 'Pause'}
          className={cn(
            'grid size-16 place-items-center rounded-full shadow-lg transition-transform active:scale-95',
            paused ? `${ACTIVITY_META[type].gradient} text-ink-on-accent` : 'bg-secondary text-secondary-foreground',
          )}
        >
          {paused ? <Play className="size-7 translate-x-0.5 fill-current" aria-hidden /> : <Pause className="size-7 fill-current" aria-hidden />}
        </button>
        <HoldButton
          label="Stop (press and hold)"
          onComplete={onStop}
          className="grid size-16 place-items-center rounded-full bg-destructive text-white shadow-lg shadow-destructive/30"
        >
          <Square className="size-6 fill-current" aria-hidden />
        </HoldButton>
      </div>
      <p className="text-xs text-muted-foreground">Hold the stop button to finish</p>
    </div>
  );
}
