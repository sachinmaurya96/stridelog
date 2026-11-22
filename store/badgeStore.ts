import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UnlockedBadge } from '@/data/types';

interface BadgeState {
  unlocked: UnlockedBadge[];
  /** Badge ids waiting for their unlock celebration (not persisted). */
  queue: string[];
  unlock: (badges: UnlockedBadge[]) => void;
  dismiss: () => void;
  replaceAll: (badges: UnlockedBadge[]) => void;
  reset: () => void;
}

export const useBadgeStore = create<BadgeState>()(
  persist(
    (set) => ({
      unlocked: [],
      queue: [],
      unlock: (badges) =>
        set((s) => {
          const fresh = badges.filter((b) => !s.unlocked.some((u) => u.id === b.id));
          if (!fresh.length) return s;
          return { unlocked: [...s.unlocked, ...fresh], queue: [...s.queue, ...fresh.map((b) => b.id)] };
        }),
      dismiss: () => set((s) => ({ queue: s.queue.slice(1) })),
      replaceAll: (badges) => set({ unlocked: badges, queue: [] }),
      reset: () => set({ unlocked: [], queue: [] }),
    }),
    {
      name: 'stridelog-badges',
      version: 1,
      partialize: (s) => ({ unlocked: s.unlocked }),
    },
  ),
);
