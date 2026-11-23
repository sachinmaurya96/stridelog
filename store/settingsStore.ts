import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '@/data/types';

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  weightKg: 70,
  heightCm: 170,
  units: 'km',
  dailyGoalSteps: 8000,
  weeklyGoalActivities: 4,
  weeklyGoalKm: 20,
  theme: 'dark',
  onboarded: false,
  age: 30,
  sex: 'unspecified',
  customTasks: [],
};

interface SettingsState extends Settings {
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

export function pickSettings(state: Settings): Settings {
  return {
    name: state.name,
    weightKg: state.weightKg,
    heightCm: state.heightCm,
    units: state.units,
    dailyGoalSteps: state.dailyGoalSteps,
    weeklyGoalActivities: state.weeklyGoalActivities,
    weeklyGoalKm: state.weeklyGoalKm,
    theme: state.theme,
    onboarded: state.onboarded,
    age: state.age,
    sex: state.sex,
    customTasks: state.customTasks,
  };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'stridelog-settings',
      version: 1,
      partialize: (s) => pickSettings(s),
    },
  ),
);

/** Read the current settings outside React (e.g. in the tracker or badge service). */
export const getSettings = () => pickSettings(useSettingsStore.getState());
