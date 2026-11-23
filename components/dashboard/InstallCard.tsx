'use client';

import { Download, Share, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { isIOS, isStandalone, useInstallStore } from '@/store/installStore';
import { useUiStore } from '@/store/uiStore';

/** Dismissible "Install StrideLog" prompt, shown only when the app can be installed and isn't yet. */
export function InstallCard() {
  const { prompt, installed, install } = useInstallStore();
  const dismissed = useUiStore((s) => s.installDismissed);
  const dismiss = useUiStore((s) => s.dismissInstall);
  const ios = isIOS();
  if (dismissed || installed || isStandalone() || (!prompt && !ios)) return null;

  return (
    <section aria-labelledby="install-title" className="glass relative flex flex-col gap-3 rounded-2xl p-5 pr-14 sm:flex-row sm:items-center">
      <div className="flex-1">
        <h2 id="install-title" className="font-semibold">
          Install StrideLog
        </h2>
        <p className="text-sm text-muted-foreground">
          {ios ? (
            <>
              Tap <Share className="inline size-4 align-text-bottom" aria-label="Share" /> then <strong>Add to Home Screen</strong> to open it full
              screen, like an app.
            </>
          ) : (
            'Open it from your home screen, full screen, even offline.'
          )}
        </p>
      </div>
      {prompt && (
        <Button
          className="bg-run-gradient text-ink-on-accent hover:opacity-90"
          onClick={async () => {
            if (await install()) toast.success('StrideLog installed');
          }}
        >
          <Download aria-hidden /> Install
        </Button>
      )}
      <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={dismiss} aria-label="Dismiss install suggestion">
        <X aria-hidden />
      </Button>
    </section>
  );
}
