'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { NAV_ITEMS, isActive } from './nav';

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'sticky top-0 h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 px-4 py-6 backdrop-blur',
        className,
      )}
    >
      <Link href="/" className="mb-8 rounded-xl px-2" aria-label="StrideLog home">
        <Logo />
      </Link>

      <Link
        href="/track"
        className="mb-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-run-gradient font-semibold text-ink-on-accent shadow-lg shadow-run/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <Play className="size-4 fill-current" aria-hidden />
        Start activity
      </Link>

      <nav aria-label="Main" className="flex flex-col gap-1">
        {NAV_ITEMS.filter((i) => i.href !== '/track').map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground',
                active && 'bg-sidebar-accent text-sidebar-foreground',
              )}
            >
              {active && (
                <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-run-gradient" aria-hidden />
              )}
              <item.icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
