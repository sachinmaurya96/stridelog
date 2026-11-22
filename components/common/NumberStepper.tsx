'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface NumberStepperProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  hint?: string;
  className?: string;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Number input with large −/+ buttons. Typed values are clamped to [min, max] on blur. */
export function NumberStepper({ id, label, value, onChange, min, max, step = 1, unit, hint, className }: NumberStepperProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const round = (v: number) => Math.round(v / step) * step;
  const commit = (v: number) => onChange(clamp(round(v), min, max));

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-xl"
          onClick={() => commit(value - step)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus aria-hidden />
        </Button>
        <div className="relative flex-1">
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            value={draft ?? String(value)}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (draft !== null) {
                const n = Number(draft);
                if (draft.trim() !== '' && Number.isFinite(n)) commit(n);
                setDraft(null);
              }
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            aria-describedby={hint ? `${id}-hint` : undefined}
            className={cn('text-center text-lg font-semibold tabular-nums', unit && 'pr-12')}
          />
          {unit && (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-xl"
          onClick={() => commit(value + step)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus aria-hidden />
        </Button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
