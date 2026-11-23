import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallState {
  /** The deferred `beforeinstallprompt` event (Chrome / Edge / Android). */
  prompt: BeforeInstallPromptEvent | null;
  installed: boolean;
  install: () => Promise<boolean>;
}

export const useInstallStore = create<InstallState>()((set, get) => ({
  prompt: null,
  installed: false,
  install: async () => {
    const p = get().prompt;
    if (!p) return false;
    await p.prompt();
    const { outcome } = await p.userChoice;
    set({ prompt: null, installed: outcome === 'accepted' });
    return outcome === 'accepted';
  },
}));

// Listen as soon as this module loads: the event can fire before React has mounted.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    useInstallStore.setState({ prompt: e as BeforeInstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => useInstallStore.setState({ prompt: null, installed: true }));
}

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

export const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
