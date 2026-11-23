'use client';

import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/common/Segmented';

/** Dev-only: feed a fake 2 km loop into the tracker instead of real GPS. */
export function SimulateControls({
  simulating,
  recording,
  still,
  onStill,
  onStart,
  onStop,
}: {
  simulating: boolean;
  recording?: boolean;
  still?: boolean;
  onStill?: (still: boolean) => void;
  onStart: (speedFactor: number) => void;
  onStop: () => void;
}) {
  const [speed, setSpeed] = useState<'1' | '5' | '20'>('5');
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-violet-400/40 p-3">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-300">
        <FlaskConical className="size-3.5" aria-hidden /> Developer: GPS simulator
      </span>
      {simulating && recording ? (
        <Button variant="outline" onClick={() => onStill?.(!still)} aria-pressed={still}>
          {still ? 'Start moving again' : 'Stand still (GPS keeps drifting)'}
        </Button>
      ) : simulating ? (
        <Button variant="outline" size="sm" onClick={onStop}>
          Stop simulation
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Segmented
            label="Simulation speed"
            value={speed}
            onChange={setSpeed}
            className="flex-1"
            options={[
              { value: '1', label: '1×' },
              { value: '5', label: '5×' },
              { value: '20', label: '20×' },
            ]}
          />
          <Button variant="outline" onClick={() => onStart(Number(speed))}>
            Simulate route
          </Button>
        </div>
      )}
    </div>
  );
}
