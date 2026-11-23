'use client';

import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ACTIVITY_META } from '@/components/common/activity';
import { now } from '@/lib/clock';
import { distanceValue, formatDuration } from '@/lib/format';
import { useSettingsStore } from '@/store/settingsStore';
import { useTrackingStore } from '@/store/trackingStore';

/** After a refresh or crash: "You have an unfinished run. Resume?" */
export function ResumePrompt() {
  const router = useRouter();
  const s = useTrackingStore();
  const units = useSettingsStore((st) => st.units);
  const open = s.recovered && (s.status === 'paused' || s.status === 'finished');
  const label = ACTIVITY_META[s.type].label.toLowerCase();

  const go = (action?: () => void) => {
    action?.();
    s.acknowledgeRecovery();
    router.push('/track');
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {s.status === 'finished' ? `You have an unsaved ${label}` : `You have an unfinished ${label}. Resume?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {formatDuration(s.movingMs / 1000)} · {distanceValue(s.distanceM, units).toFixed(2)} {units} recorded so far.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="ghost" onClick={() => s.reset()}>
            Discard
          </Button>
          {s.status === 'paused' ? (
            <>
              <Button variant="outline" onClick={() => go(() => s.finish(now()))}>
                Finish
              </Button>
              <Button onClick={() => go(() => s.resume(now()))}>Resume</Button>
            </>
          ) : (
            <Button onClick={() => go()}>Review &amp; save</Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
