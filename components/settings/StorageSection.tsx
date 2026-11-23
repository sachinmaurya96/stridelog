'use client';

import { useEffect, useState } from 'react';
import { HardDrive, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDataCounts } from '@/hooks/useData';
import { estimateStorage, formatBytes, isStoragePersisted, requestPersistentStorage } from '@/lib/storage';

export function StorageSection() {
  const counts = useDataCounts();
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null | undefined>(undefined);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  // Re-measure whenever the amount of stored data changes.
  const signature = counts ? `${counts.activities}-${counts.notes}-${counts.photos}` : '';
  useEffect(() => {
    let cancelled = false;
    void Promise.all([estimateStorage(), isStoragePersisted()]).then(([e, p]) => {
      if (cancelled) return;
      setEstimate(e);
      setPersisted(p);
    });
    return () => {
      cancelled = true;
    };
  }, [signature]);

  const pct = estimate && estimate.quota ? Math.max(1, Math.round((estimate.usage / estimate.quota) * 100)) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="size-4 text-run-ink" aria-hidden />
          Storage
        </CardTitle>
        <CardDescription>Photos and routes are kept in this browser&apos;s storage.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {estimate === undefined ? (
          <p className="text-sm text-muted-foreground">Measuring…</p>
        ) : estimate === null ? (
          <p className="text-sm text-muted-foreground">This browser doesn&apos;t report storage usage.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              Using <span className="font-semibold">{formatBytes(estimate.usage)}</span> of about {formatBytes(estimate.quota)}
            </p>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="Storage used"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <div className="h-full rounded-full bg-foreground/50" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm">
            <ShieldCheck className={persisted ? 'size-4 text-emerald-500' : 'size-4 text-muted-foreground'} aria-hidden />
            {persisted ? 'Protected: the browser won’t clear your data.' : 'Not protected: the browser may clear data when space runs low.'}
          </p>
          {!persisted && (
            <Button variant="outline" onClick={async () => setPersisted(await requestPersistentStorage())}>
              Protect my data
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
