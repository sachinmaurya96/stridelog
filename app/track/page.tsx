import type { Metadata } from 'next';
import { ClientOnly } from '@/components/layout/ClientOnly';
import { MapSkeleton } from '@/components/map/MapSkeleton';
import { TrackView } from '@/components/tracking/TrackView';

export const metadata: Metadata = { title: 'Track' };

export default function Page() {
  return (
    <ClientOnly fallback={<MapSkeleton className="h-dvh lg:h-[calc(100dvh-6.5rem)] lg:rounded-2xl" />}>
      <TrackView />
    </ClientOnly>
  );
}
