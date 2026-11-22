'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface Option<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Classes applied when this option is selected (e.g. a run/walk gradient). */
  activeClassName?: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  label: string;
  className?: string;
  disabled?: boolean;
}

/** Single-choice segmented control. Never allows "no selection". */
export function Segmented<T extends string>({ value, onChange, options, label, className, disabled }: SegmentedProps<T>) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={label}
      spacing={0}
      disabled={disabled}
      className={cn('w-full rounded-xl bg-muted p-1', className)}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          className={cn(
            'h-10 flex-1 gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-all data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm',
            value === o.value && o.activeClassName,
          )}
        >
          {o.icon}
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
