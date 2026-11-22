import { Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-run-gradient text-ink-on-accent shadow-lg shadow-run/25">
        <Footprints className="size-5" aria-hidden />
      </span>
      {showText && <span className="text-lg font-extrabold tracking-tight">StrideLog</span>}
    </span>
  );
}
