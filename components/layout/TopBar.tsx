'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHydrated } from '@/hooks/useHydrated';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';
import { pageTitle } from './nav';

function greetingFor(hour: number) {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function Greeting() {
  const name = useSettingsStore((s) => s.name);
  const greeting = greetingFor(new Date().getHours());
  return (
    <p className="truncate text-sm text-muted-foreground">
      {greeting}
      {name ? `, ${name.split(' ')[0]}` : ''} 👋
    </p>
  );
}

export function TopBar({ className }: { className?: string }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const isHome = pathname === '/';

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center gap-3 bg-background/70 px-4 pt-safe backdrop-blur-xl md:px-6 lg:px-8',
        className,
      )}
    >
      <div className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-3">
        <Link href="/" className="rounded-xl lg:hidden" aria-label="StrideLog home">
          <Logo showText={false} />
        </Link>
        <div className="min-w-0">
          {isHome && (hydrated ? <Greeting /> : <p className="h-5" aria-hidden />)}
          <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">
            {isHome ? 'Your dashboard' : pageTitle(pathname)}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button asChild variant="ghost" size="icon" className="rounded-full lg:hidden">
          <Link href="/settings" aria-label="Settings">
            <Settings aria-hidden />
          </Link>
        </Button>
      </div>
    </header>
  );
}
