'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const immersive = pathname === '/track';

  const content = (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex min-h-0 flex-1 flex-col"
    >
      {children}
    </motion.div>
  );

  if (pathname === '/onboarding') {
    return <main className="flex min-h-dvh flex-col">{content}</main>;
  }

  return (
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
      <BottomNav className="lg:hidden" />
    </div>
  );
}
