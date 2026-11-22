'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Award, CalendarDays, Ellipsis, House, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { MORE_ITEMS, isActive } from './nav';

const TABS = [
  { href: '/', label: 'Home', icon: House },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/badges', label: 'Badges', icon: Award },
];

const tabClass =
  'flex h-14 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium text-muted-foreground transition-colors';

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_ITEMS.some((i) => isActive(pathname, i.href));

  const tab = (t: (typeof TABS)[number]) => {
    const active = isActive(pathname, t.href);
    return (
      <Link
        key={t.href}
        href={t.href}
        aria-current={active ? 'page' : undefined}
        className={cn(tabClass, active && 'text-foreground')}
      >
        <t.icon className={cn('size-6', active && 'text-run-ink')} aria-hidden />
        {t.label}
      </Link>
    );
  };

  return (
    <>
      <nav
        aria-label="Main"
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 pb-safe backdrop-blur-xl',
          className,
        )}
      >
        <div className="mx-auto flex max-w-xl items-end justify-between px-2">
          {tab(TABS[0])}
          {tab(TABS[1])}
          <div className="flex flex-1 justify-center">
            <Link
              href="/track"
              aria-label="Start activity"
              aria-current={pathname === '/track' ? 'page' : undefined}
              className="-mt-6 mb-1 grid size-16 place-items-center rounded-full bg-run-gradient text-ink-on-accent shadow-xl shadow-run/40 ring-4 ring-background transition-transform active:scale-95"
            >
              <Play className="size-7 translate-x-0.5 fill-current" aria-hidden />
            </Link>
          </div>
          {tab(TABS[2])}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={cn(tabClass, moreActive && 'text-foreground')}
          >
            <Ellipsis className={cn('size-6', moreActive && 'text-run-ink')} aria-hidden />
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
            <SheetDescription className="sr-only">Other sections of StrideLog</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 px-4 pb-6">
            {MORE_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'glass flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl text-sm font-medium',
                    active && 'ring-2 ring-run',
                  )}
                >
                  <item.icon className="size-6" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
