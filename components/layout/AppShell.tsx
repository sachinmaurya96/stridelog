'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useHydrated } from '@/hooks/useHydrated';
import { useSettingsStore } from '@/store/settingsStore';
import { RouteGradients } from '@/components/map/RouteGradients';
import { ActiveSessionBanner } from '@/components/tracking/ActiveSessionBanner';
import { ResumePrompt } from '@/components/tracking/ResumePrompt';
import { TrackerProvider } from '@/components/tracking/TrackerProvider';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { PageSkeleton } from './PageSkeleton';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const onboarded = useSettingsStore((s) => s.onboarded);
  const immersive = pathname === '/track';
  const needsOnboarding = hydrated && !onboarded && pathname !== '/onboarding';

  useEffect(() => {
    if (needsOnboarding) router.replace('/onboarding');
  }, [needsOnboarding, router]);

  const content = (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex min-h-0 flex-1 flex-col"
    >
      {needsOnboarding ? <PageSkeleton /> : children}
    </motion.div>
  );

  if (pathname === '/onboarding') {
    return <main className="flex min-h-dvh flex-col">{content}</main>;
  }

  return (
    <TrackerProvider>
      <div className="flex min-h-dvh">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <Sidebar className="hidden lg:flex" />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar className={cn(immersive && 'hidden lg:flex')} />
          <main
            id="main"
            className={cn(
              'mx-auto flex w-full max-w-7xl flex-1 flex-col',
              immersive ? 'lg:px-8 lg:pb-8' : 'px-4 pb-32 md:px-6 lg:px-8 lg:pb-10',
            )}
          >
            {content}
          </main>
        </div>
        {!immersive && <BottomNav className="lg:hidden" />}
        {hydrated && (
          <>
            <ActiveSessionBanner />
            <ResumePrompt />
          </>
        )}
        <RouteGradients />
      </div>
    </TrackerProvider>
  );
}
