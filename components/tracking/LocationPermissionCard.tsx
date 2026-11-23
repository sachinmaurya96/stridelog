'use client';

import { MapPinOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LocationPermissionCard({ unsupported, onRetry }: { unsupported?: boolean; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
      <div className="flex items-center gap-2 font-semibold">
        <MapPinOff className="size-5 text-destructive" aria-hidden />
        {unsupported ? 'Location is not available' : 'Location is turned off'}
      </div>
      <p className="text-sm text-muted-foreground">
        {unsupported
          ? 'This browser cannot share your location. Try Chrome or Safari on your phone.'
          : 'Enable location for this site in your browser settings so StrideLog can draw your route. On iPhone: Settings → Privacy & Security → Location Services → Safari Websites.'}
      </p>
      {!unsupported && (
        <Button variant="outline" onClick={onRetry} className="self-start">
          <RotateCcw aria-hidden /> Try again
        </Button>
      )}
    </div>
  );
}
