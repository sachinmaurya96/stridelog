import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ClientOnly } from '@/components/layout/ClientOnly';
import { PageSkeleton } from '@/components/layout/PageSkeleton';
import { PhotosView } from '@/components/photos/PhotosView';

export const metadata: Metadata = { title: 'Photos' };

export default function Page() {
  // useSearchParams (?date=) needs a Suspense boundary.
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ClientOnly>
        <PhotosView />
      </ClientOnly>
    </Suspense>
  );
}
