import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ClientOnly } from '@/components/layout/ClientOnly';
import { PageSkeleton } from '@/components/layout/PageSkeleton';
import { NotesView } from '@/components/notes/NotesView';

export const metadata: Metadata = { title: 'Notes' };

export default function Page() {
  // useSearchParams (?date=) needs a Suspense boundary.
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ClientOnly>
        <NotesView />
      </ClientOnly>
    </Suspense>
  );
}
