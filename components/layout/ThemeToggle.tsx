'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useHydrated } from '@/hooks/useHydrated';

export function ThemeToggle() {
  const hydrated = useHydrated();
  const { resolved, setTheme } = useAppTheme();
  const next = resolved === 'dark' ? 'light' : 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={() => setTheme(next)}
      aria-label={hydrated ? `Switch to ${next} theme` : 'Toggle theme'}
    >
      {hydrated && resolved === 'light' ? <Moon aria-hidden /> : <Sun aria-hidden />}
    </Button>
  );
}
