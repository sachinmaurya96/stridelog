'use client';

import { useTheme } from 'next-themes';
import { useSettingsStore } from '@/store/settingsStore';
import type { ThemePref } from '@/data/types';

/**
 * The settings store is the source of truth for the theme; `ThemeSync` pushes it into next-themes.
 * `resolved` is the theme actually shown ('dark' | 'light').
 */
export function useAppTheme() {
  const theme = useSettingsStore((s) => s.theme);
  const update = useSettingsStore((s) => s.update);
  const { resolvedTheme } = useTheme();
  return {
    theme,
    resolved: (resolvedTheme === 'light' ? 'light' : 'dark') as 'light' | 'dark',
    setTheme: (t: ThemePref) => update({ theme: t }),
  };
}
