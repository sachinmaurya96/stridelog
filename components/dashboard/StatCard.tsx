import { ArrowDown, ArrowUp, Minus, type LucideIcon } from 'lucide-react';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  unit?: string;
  /** % change vs the previous period (null = nothing to compare with). */
  delta: number | null;
  comparedTo: string;
  icon: LucideIcon;
}

export function StatCard({ label, value, format, unit, delta, comparedTo, icon: Icon }: StatCardProps) {
  const up = delta != null && delta > 0.5;
  const down = delta != null && delta < -0.5;
  const DeltaIcon = up ? ArrowUp : down ? ArrowDown : Minus;

  return (
    <div className="glass flex flex-col gap-2 rounded-2xl p-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="text-3xl font-bold tracking-tight">
        <AnimatedNumber value={value} format={format} />
        {unit && <span className="ml-1 text-base font-semibold text-muted-foreground">{unit}</span>}
      </div>
      <div
        className={cn(
          'flex items-center gap-1 text-xs font-medium',
          up && 'text-emerald-600 dark:text-emerald-400',
          down && 'text-rose-600 dark:text-rose-400',
          !up && !down && 'text-muted-foreground',
        )}
      >
        <DeltaIcon className="size-3.5" aria-hidden />
        {delta == null ? (
          <span>No data for {comparedTo}</span>
        ) : (
          <span>
            {up ? '+' : ''}
            {Math.round(delta)}% <span className="text-muted-foreground">vs {comparedTo}</span>
          </span>
        )}
      </div>
    </div>
  );
}
