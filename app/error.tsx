'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message = error instanceof Error ? error.message : String(error);
  const storageBlocked = /indexeddb|database|quota|storage/i.test(message);

  return (
    <section className="glass mx-auto mt-6 flex max-w-md flex-col items-center gap-3 rounded-2xl p-8 text-center" role="alert">
      <TriangleAlert className="size-10 text-destructive" aria-hidden />
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">
        {storageBlocked
          ? 'StrideLog could not open its local storage. Private browsing or full storage can cause this.'
          : 'This page hit an unexpected error. Your saved data is safe on this device.'}
      </p>
      <div className="mt-2 flex gap-2">
        <Button onClick={() => retry()}>
          <RotateCcw aria-hidden /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </section>
  );
}
