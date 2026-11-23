'use client';

import { LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function RecenterButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      onClick={onClick}
      aria-label="Recenter map on my location"
      className={cn('glass-strong absolute z-10 rounded-full shadow-lg', className)}
    >
      <LocateFixed aria-hidden className="text-[#2f80ff]" />
    </Button>
  );
}
