'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { DailyPhoto } from '@/data/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { photoRepo } from '@/data/repositories';
import { useObjectUrl } from '@/hooks/useObjectUrl';
import { fromDayKey } from '@/lib/stats';

function Caption({ photo }: { photo: DailyPhoto }) {
  const [value, setValue] = useState(photo.caption ?? '');
  return (
    <Input
      aria-label="Caption"
      placeholder="Add a caption"
      value={value}
      maxLength={120}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== (photo.caption ?? '')) void photoRepo.update(photo.id, { caption: value.trim() || undefined });
      }}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className="border-white/20 bg-white/10 text-white placeholder:text-white/60"
    />
  );
}

/** Full-screen viewer: swipe or arrow keys between days, edit caption, delete. */
export function PhotoViewer({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: DailyPhoto[];
  index: number | null;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const photo = index != null ? photos[index] : undefined;
  const url = useObjectUrl(photo?.blob);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const touchX = useRef<number | null>(null);

  // Newest first, so "previous day" is the next index.
  const canOlder = index != null && index < photos.length - 1;
  const canNewer = index != null && index > 0;
  const older = () => canOlder && onIndexChange(index! + 1);
  const newer = () => canNewer && onIndexChange(index! - 1);

  useEffect(() => {
    if (index != null && index >= photos.length) {
      if (photos.length) onIndexChange(photos.length - 1);
      else onClose();
    }
  }, [index, photos.length, onIndexChange, onClose]);

  return (
    <Dialog open={!!photo} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-dvh max-h-none w-screen max-w-none flex-col gap-0 rounded-none border-0 bg-black p-0 text-white sm:max-w-none"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') older();
          if (e.key === 'ArrowRight') newer();
        }}
      >
        {photo && (
          <>
            <div className="flex items-center gap-2 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-white">{format(fromDayKey(photo.date), 'EEEE d MMMM yyyy')}</DialogTitle>
                <DialogDescription className="text-white/60">
                  {photos.length - index!} of {photos.length}
                </DialogDescription>
              </div>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setConfirmDelete(true)} aria-label="Delete photo">
                <Trash2 aria-hidden />
              </Button>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" aria-label="Close">
                  <X aria-hidden />
                </Button>
              </DialogClose>
            </div>

            <div
              className="relative flex min-h-0 flex-1 items-center justify-center"
              onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
              onTouchEnd={(e) => {
                if (touchX.current == null) return;
                const dx = e.changedTouches[0].clientX - touchX.current;
                touchX.current = null;
                if (dx > 50) older();
                else if (dx < -50) newer();
              }}
            >
              {url && (
                // eslint-disable-next-line @next/next/no-img-element -- local blob URL
                <img src={url} alt={photo.caption || `Progress photo from ${photo.date}`} className="max-h-full max-w-full object-contain" />
              )}
              <Button
                variant="ghost"
                size="icon-lg"
                onClick={older}
                disabled={!canOlder}
                aria-label="Previous day"
                className="absolute left-2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
              >
                <ChevronLeft aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-lg"
                onClick={newer}
                disabled={!canNewer}
                aria-label="Next day"
                className="absolute right-2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
              >
                <ChevronRight aria-hidden />
              </Button>
            </div>

            <div className="mx-auto w-full max-w-lg p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <Caption key={photo.id} photo={photo} />
            </div>

            <ConfirmDialog
              open={confirmDelete}
              onOpenChange={setConfirmDelete}
              title="Delete this photo?"
              description="It will be removed from this device. This can't be undone."
              confirmLabel="Delete"
              destructive
              onConfirm={async () => {
                const removed = photo;
                await photoRepo.remove(removed.id);
                toast('Photo deleted', {
                  duration: 8000,
                  action: { label: 'Undo', onClick: () => void photoRepo.save(removed) },
                });
              }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
