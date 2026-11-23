'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useDragControls, type PanInfo } from 'motion/react';
import { ChevronUp, Play, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ACTIVITY_META } from '@/components/common/activity';
import { LiveMap } from '@/components/map/MapClient';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { useTracker } from '@/hooks/useTracker';
import { cn } from '@/lib/utils';
import { ActivityTypeToggle } from './ActivityTypeToggle';
import { CountdownOverlay } from './CountdownOverlay';
import { GpsStatus } from './GpsStatus';
import { LiveStats } from './LiveStats';
import { LocationPermissionCard } from './LocationPermissionCard';
import { SimulateControls } from './SimulateControls';
import { SplitsList } from './SplitsList';
import { SummarySheet } from './SummarySheet';
import { TrackControls } from './TrackControls';

export function TrackView() {
  const router = useRouter();
  const t = useTracker();
  const isDesktop = useIsDesktop();
  const { session, stats, units } = t;
  const [following, setFollowing] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const dragControls = useDragControls();
  const meta = ACTIVITY_META[session.type];
  const recording = session.status === 'tracking' || session.status === 'paused' || session.status === 'finished';
  const showMore = expanded || isDesktop;
  const locationBlocked = !t.simulating && (t.permission === 'denied' || t.permission === 'unsupported');

  function onPanelDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y < -40) setExpanded(true);
    else if (info.offset.y > 40) setExpanded(false);
  }

  async function save(title: string) {
    try {
      const activity = await t.save(title);
      toast.success(`${ACTIVITY_META[activity.type].label} saved`);
      router.push(`/activities/${activity.id}`);
    } catch (e) {
      toast.error(`Could not save: ${(e as Error).message}`);
    }
  }

  return (
    <div className="relative h-dvh lg:grid lg:h-[calc(100dvh-6.5rem)] lg:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)] lg:gap-6 lg:pt-2">
      {/* Map */}
      <div className="absolute inset-0 lg:relative lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border">
        <LiveMap
          fix={t.fix}
          route={session.route}
          type={session.type}
          following={following}
          onFollowingChange={setFollowing}
          className="size-full"
          recenterClassName="top-[calc(4.5rem+env(safe-area-inset-top))] right-3 lg:top-3"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <Button asChild variant="secondary" size="icon" className="glass-strong pointer-events-auto rounded-full lg:invisible">
            <Link href="/" aria-label={recording ? 'Back to the app (recording continues)' : 'Close'}>
              <X aria-hidden />
            </Link>
          </Button>
          <GpsStatus fix={t.fix} permission={t.permission} simulating={t.simulating} className="pointer-events-auto" />
          <span className="size-11 lg:hidden" aria-hidden />
        </div>
      </div>

      {/* Stats / controls panel */}
      <motion.section
        aria-label={recording ? 'Live stats' : 'Start an activity'}
        className="glass-strong absolute inset-x-0 bottom-0 z-20 flex max-h-[75dvh] flex-col gap-4 overflow-y-auto rounded-t-3xl px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:static lg:max-h-none lg:rounded-2xl lg:p-5"
        drag={isDesktop ? false : 'y'}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15}
        onDragEnd={onPanelDragEnd}
      >
        {recording && !isDesktop && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            onPointerDown={(e) => dragControls.start(e)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Show fewer stats' : 'Show more stats'}
            className="mx-auto flex h-8 w-full touch-none items-center justify-center"
          >
            <span className="h-1.5 w-12 rounded-full bg-foreground/25" />
          </button>
        )}

        {!recording && (
          <>
            <div className="hidden lg:block">
              <h2 className="text-lg font-bold">Ready when you are</h2>
              <p className="text-sm text-muted-foreground">Pick an activity and wait for a good GPS signal.</p>
            </div>
            <ActivityTypeToggle value={session.type} onChange={session.setType} />
            {locationBlocked && (
              <LocationPermissionCard unsupported={t.permission === 'unsupported'} onRetry={t.retryGps} />
            )}
            <Button
              size="lg"
              onClick={t.start}
              disabled={!t.gpsReady || session.status === 'countdown'}
              className={cn('h-16 rounded-2xl text-lg font-bold text-ink-on-accent shadow-lg hover:opacity-90', meta.gradient)}
            >
              <Play className="size-5 fill-current" aria-hidden /> Start {meta.label.toLowerCase()}
            </Button>
            {!t.gpsReady && !locationBlocked && (
              <p className="-mt-2 text-center text-xs text-muted-foreground" aria-live="polite">
                Waiting for an accurate GPS fix…
              </p>
            )}
            <SimulateControls simulating={t.simulating} onStart={t.startSimulation} onStop={t.stopSimulation} />
          </>
        )}

        {recording && (
          <>
            <div className="flex items-center justify-center gap-2 text-sm font-semibold">
              <meta.Icon className={cn('size-4', meta.ink)} aria-hidden />
              <span className={meta.ink}>{meta.label}</span>
            </div>
            <LiveStats stats={stats} units={units} expanded={showMore} paused={session.status !== 'tracking'} />
            {showMore && (
              <section aria-labelledby="live-splits">
                <h3 id="live-splits" className="mb-2 text-sm font-semibold">
                  Splits
                </h3>
                <SplitsList splits={t.splits} units={units} />
              </section>
            )}
            {session.status !== 'finished' && (
              <TrackControls
                status={session.status === 'paused' ? 'paused' : 'tracking'}
                type={session.type}
                onPause={t.pause}
                onResume={t.resume}
                onStop={t.stop}
              />
            )}
            {!isDesktop && !expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="-mt-2 flex h-8 items-center justify-center gap-1 text-xs text-muted-foreground"
              >
                <ChevronUp className="size-4" aria-hidden /> Swipe up for more
              </button>
            )}
          </>
        )}
      </motion.section>

      {session.status === 'countdown' && <CountdownOverlay onDone={t.begin} onCancel={session.cancelCountdown} />}

      {session.startedAt != null && (
        <SummarySheet
          key={session.startedAt}
          open={session.status === 'finished' && !session.recovered}
          type={session.type}
          startedAt={session.startedAt}
          route={session.route}
          stats={stats}
          splits={t.splits}
          units={units}
          onSave={save}
          onDiscard={() => {
            t.discard();
            toast('Activity discarded');
          }}
          onBack={session.reopen}
        />
      )}
    </div>
  );
}
