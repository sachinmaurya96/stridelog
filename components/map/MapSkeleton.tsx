import { Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('grid size-full animate-pulse place-items-center bg-muted text-muted-foreground', className)}
      aria-label="Loading map"
      role="img"
    >
      <MapIcon className="size-8 opacity-50" aria-hidden />
    </div>
  );
}
