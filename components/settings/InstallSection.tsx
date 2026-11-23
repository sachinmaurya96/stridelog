'use client';

import { CheckCircle2, Download, Share, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isIOS, isStandalone, useInstallStore } from '@/store/installStore';

export function InstallSection() {
  const { prompt, installed, install } = useInstallStore();
  const standalone = isStandalone();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="size-4 text-run-ink" aria-hidden />
          Install app
        </CardTitle>
        <CardDescription>Add StrideLog to your home screen to open it full screen, like a native app.</CardDescription>
      </CardHeader>
      <CardContent>
        {standalone || installed ? (
          <p className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="size-4 text-emerald-500" aria-hidden /> StrideLog is installed on this device.
          </p>
        ) : prompt ? (
          <Button
            onClick={async () => {
              if (await install()) toast.success('StrideLog installed');
            }}
            className="bg-run-gradient text-ink-on-accent hover:opacity-90"
          >
            <Download aria-hidden /> Install StrideLog
          </Button>
        ) : isIOS() ? (
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
            <li>
              Open this page in <strong>Safari</strong>.
            </li>
            <li>
              Tap <Share className="inline size-4 align-text-bottom" aria-label="Share" /> <strong>Share</strong>.
            </li>
            <li>
              Choose <strong>Add to Home Screen</strong>.
            </li>
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            Use your browser&apos;s menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
