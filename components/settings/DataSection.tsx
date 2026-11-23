'use client';

import { useRef, useState } from 'react';
import { Database, Download, FlaskConical, Trash2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { activityRepo } from '@/data/repositories';
import { checkBadges } from '@/data/badgeService';
import { backupFileName, exportAll, importAll, resetAll } from '@/data/backup';
import { useDataCounts } from '@/hooks/useData';
import { downloadBlob } from '@/lib/download';
import { createDemoHistory, createSampleActivity } from '@/lib/sample';
import { getSettings } from '@/store/settingsStore';

export function DataSection() {
  const counts = useDataCounts();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const router = useRouter();

  async function onExport() {
    setBusy(true);
    try {
      downloadBlob(await exportAll(), backupFileName());
      toast.success('Backup downloaded');
    } catch (e) {
      toast.error(`Export failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function onImport(file: File) {
    setBusy(true);
    try {
      const r = await importAll(file);
      toast.success(`Restored ${r.activities} activities, ${r.notes} notes and ${r.photos} photos`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    await resetAll();
    toast.success('All data deleted');
    router.replace('/onboarding');
  }

  async function loadDemo() {
    const list = createDemoHistory(new Date(), getSettings());
    for (const a of list) await activityRepo.save(a);
    toast.success(`Added ${list.length} demo activities`);
    await checkBadges();
  }

  async function addSample() {
    await activityRepo.save(createSampleActivity(Math.random() < 0.5 ? 'run' : 'walk', Date.now() - 45 * 60_000, getSettings()));
    toast.success('Sample activity saved');
    await checkBadges();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="size-4 text-run-ink" aria-hidden />
          Your data
        </CardTitle>
        <CardDescription>
          Everything is stored on this device. Export a backup before clearing your browser data.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm tabular-nums" aria-live="polite">
          {counts
            ? `${counts.activities} activities · ${counts.notes} notes · ${counts.photos} photos`
            : 'Counting…'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onExport} disabled={busy}>
            <Download aria-hidden /> Export all data
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Upload aria-hidden /> Import backup
          </Button>
          <Button variant="destructive" onClick={() => setConfirmReset(true)} disabled={busy}>
            <Trash2 aria-hidden /> Reset all data
          </Button>
          {process.env.NODE_ENV !== 'production' && (
            <Button variant="ghost" onClick={addSample}>
              <FlaskConical aria-hidden /> Add sample activity
            </Button>
          )}
          {process.env.NODE_ENV !== 'production' && (
            <Button variant="ghost" onClick={loadDemo}>
              <FlaskConical aria-hidden /> Load demo history
            </Button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPendingFile(f);
            e.target.value = '';
          }}
        />
      </CardContent>

      <ConfirmDialog
        open={!!pendingFile}
        onOpenChange={(o) => !o && setPendingFile(null)}
        title="Restore this backup?"
        description="Importing replaces all activities, notes, photos, badges and settings on this device."
        confirmLabel="Replace my data"
        destructive
        onConfirm={() => {
          if (pendingFile) void onImport(pendingFile);
          setPendingFile(null);
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Delete all data?"
        description="This permanently deletes every activity, note, photo, badge and setting on this device. Export a backup first if you might want them back."
        confirmLabel="Delete everything"
        destructive
        onConfirm={() => void onReset()}
      />
    </Card>
  );
}
