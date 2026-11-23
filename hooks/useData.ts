'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { activityRepo, dayLogRepo, emptyDayLog, noteRepo, photoRepo } from '@/data/repositories';

// Live queries re-run automatically whenever the underlying IndexedDB tables change.
// `undefined` means "still loading"; single-record hooks return `null` for "not found".

export function useActivities(range?: { from: number; to: number }) {
  return useLiveQuery(() => activityRepo.list(range), [range?.from, range?.to]);
}

export function useActivity(id: string) {
  return useLiveQuery(async () => (await activityRepo.get(id)) ?? null, [id]);
}

export function useNotes() {
  return useLiveQuery(() => noteRepo.list(), []);
}

export function useNote(date: string) {
  return useLiveQuery(async () => (await noteRepo.get(date)) ?? null, [date]);
}

export function useNoteDates() {
  return useLiveQuery(() => noteRepo.dates(), []);
}

export function usePhotos() {
  return useLiveQuery(() => photoRepo.list(), []);
}

export function usePhotoByDate(date: string) {
  return useLiveQuery(async () => (await photoRepo.getByDate(date)) ?? null, [date]);
}

export function usePhotoDates() {
  return useLiveQuery(() => photoRepo.dates(), []);
}

export function useDataCounts() {
  return useLiveQuery(
    async () => ({
      activities: await activityRepo.count(),
      notes: await noteRepo.count(),
      photos: await photoRepo.count(),
    }),
    [],
  );
}

/** The day's log (an empty one if nothing has been logged yet). */
export function useDayLog(date: string) {
  return useLiveQuery(async () => (await dayLogRepo.get(date)) ?? emptyDayLog(date), [date]);
}
