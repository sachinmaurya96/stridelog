'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Images } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { usePhotos } from '@/hooks/useData';
import { dayKey } from '@/lib/stats';
import { PhotoCompare } from './PhotoCompare';
import { PhotoGrid } from './PhotoGrid';
import { PhotoUploader } from './PhotoUploader';
import { PhotoViewer } from './PhotoViewer';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function PhotosView() {
  const params = useSearchParams();
  const photos = usePhotos();
  const [open, setOpen] = useState<number | null>(null);
  const today = dayKey(new Date());
  const requested = params.get('date');
  const defaultDate = requested && DATE_RE.test(requested) && requested <= today ? requested : today;

  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-2">
        <PhotoUploader defaultDate={defaultDate} />
        {photos && photos.length >= 2 && <PhotoCompare key={photos.length} photos={photos} />}
      </div>

      {photos === undefined ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" aria-busy="true" aria-label="Loading photos">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <EmptyState
          icon={Images}
          title="No photos yet"
          description="Take one photo a day and watch your progress over the weeks. Photos stay on this device."
        />
      ) : (
        <PhotoGrid photos={photos} onOpen={setOpen} />
      )}

      {photos && <PhotoViewer photos={photos} index={open} onIndexChange={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}
