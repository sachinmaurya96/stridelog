import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ClientOnly } from '@/components/layout/ClientOnly';
import { PageSkeleton } from '@/components/layout/PageSkeleton';
import { ActivityDetail } from '@/components/activities/ActivityDetail';

export const metadata: Metadata = { title: 'Activity' };

export default function Page() {
  // The id is only known at request time, and the data lives in IndexedDB.
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ClientOnly>
        <ActivityDetail />
      </ClientOnly>
    </Suspense>
  );
}
