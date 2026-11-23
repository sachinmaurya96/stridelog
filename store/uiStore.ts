import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Small UI preferences that should survive a reload. */
interface UiState {
  installDismissed: boolean;
  /** Last date ('yyyy-MM-dd') we celebrated finishing every daily task, so it only happens once a day. */
  celebratedDay: string | null;
  dismissInstall: () => void;
  markCelebrated: (day: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      installDismissed: false,
      celebratedDay: null,
      dismissInstall: () => set({ installDismissed: true }),
      markCelebrated: (day) => set({ celebratedDay: day }),
    }),
    { name: 'stridelog-ui', version: 1 },
  ),
);
