'use client';

import { useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { Camera, ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { checkBadges } from '@/data/badgeService';
import { photoRepo } from '@/data/repositories';
import type { DailyPhoto } from '@/data/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { compressImage } from '@/lib/image';
import { dayKey } from '@/lib/stats';
import { requestPersistentStorage } from '@/lib/storage';
import { cn } from '@/lib/utils';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Camera (phones), gallery / file picker and drag & drop. One photo per day by default. */
export function PhotoUploader({ defaultDate }: { defaultDate: string }) {
  const today = dayKey(new Date());
  const [date, setDate] = useState(defaultDate);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [replace, setReplace] = useState<{ file: File; existing: DailyPhoto } | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isTouch = useMediaQuery('(pointer: coarse)');

  async function save(file: File, existing?: DailyPhoto) {
    setBusy(true);
    try {
      const { blob, thumbBlob } = await compressImage(file);
      if (existing) await photoRepo.remove(existing.id);
      await photoRepo.save({ id: nanoid(), date, blob, thumbBlob, caption: existing?.caption, createdAt: Date.now() });
      toast.success(existing ? 'Photo replaced' : 'Photo saved');
      void requestPersistentStorage();
      await checkBadges();
    } catch (e) {
      toast.error((e as Error).message || 'Could not save the photo');
    } finally {
      setBusy(false);
    }
  }

  async function handle(file: File | undefined) {
    if (!file) return;
    const existing = await photoRepo.getByDate(date);
    if (existing) setReplace({ file, existing });
    else await save(file);
  }

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handle(e.target.files?.[0]);
    e.target.value = '';
  };

  return (
    <section
      aria-labelledby="upload-title"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void handle(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        'glass flex flex-col gap-4 rounded-2xl border-2 border-dashed p-5 transition-colors',
        dragging ? 'border-run bg-run/5' : 'border-transparent',
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="upload-title" className="text-lg font-bold">
            Add a progress photo
          </h2>
          <p className="text-sm text-muted-foreground">
            {isTouch ? 'Use your camera or pick one from your gallery.' : 'Choose a photo or drag & drop it here.'}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="photo-date" className="text-xs text-muted-foreground">
            Date
          </Label>
          <Input
            id="photo-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => DATE_RE.test(e.target.value) && e.target.value <= today && setDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {isTouch && (
          <Button size="lg" onClick={() => cameraRef.current?.click()} disabled={busy} className="bg-run-gradient text-ink-on-accent hover:opacity-90">
            <Camera aria-hidden /> Take photo
          </Button>
        )}
        <Button
          size="lg"
          variant={isTouch ? 'outline' : 'default'}
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className={cn(!isTouch && 'bg-run-gradient text-ink-on-accent hover:opacity-90')}
        >
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <ImagePlus aria-hidden />}
          {busy ? 'Saving…' : isTouch ? 'From gallery' : 'Choose photo'}
        </Button>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="sr-only" tabIndex={-1} aria-hidden onChange={onPick} />
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={onPick} />

      <ConfirmDialog
        open={!!replace}
        onOpenChange={(o) => !o && setReplace(null)}
        title="Replace this day's photo?"
        description="You already have a photo for this date. The new one will replace it."
        confirmLabel="Replace"
        onConfirm={() => {
          if (replace) void save(replace.file, replace.existing);
          setReplace(null);
        }}
      />
    </section>
  );
}
