import { activityRepo, noteRepo, photoRepo } from './repositories';
import type { Activity, DailyNote, DailyPhoto, Settings, UnlockedBadge } from './types';
import { DEFAULT_SETTINGS, getSettings, useSettingsStore } from '@/store/settingsStore';
import { useBadgeStore } from '@/store/badgeStore';

type SerializedPhoto = Omit<DailyPhoto, 'blob' | 'thumbBlob'> & { blob: string; thumbBlob: string };

export interface BackupFile {
  app: 'stridelog';
  version: 1;
  exportedAt: number;
  settings: Settings;
  badges: UnlockedBadge[];
  activities: Activity[];
  notes: DailyNote[];
  photos: SerializedPhoto[];
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl: string) {
  return (await fetch(dataUrl)).blob();
}

/** Everything the app stores, as one JSON file (photos as base64 data URLs). */
export async function exportAll(): Promise<Blob> {
  const [activities, notes, photos] = await Promise.all([
    activityRepo.list(),
    noteRepo.list(),
    photoRepo.list(),
  ]);
  const file: BackupFile = {
    app: 'stridelog',
    version: 1,
    exportedAt: Date.now(),
    settings: getSettings(),
    badges: useBadgeStore.getState().unlocked,
    activities,
    notes,
    photos: await Promise.all(
      photos.map(async (p) => ({
        ...p,
        blob: await blobToDataUrl(p.blob),
        thumbBlob: await blobToDataUrl(p.thumbBlob),
      })),
    ),
  };
  return new Blob([JSON.stringify(file)], { type: 'application/json' });
}

/** Replaces all local data with the contents of a backup file. */
export async function importAll(file: File) {
  let data: BackupFile;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (data?.app !== 'stridelog' || !Array.isArray(data.activities)) {
    throw new Error('That file is not a StrideLog backup.');
  }
  const photos: DailyPhoto[] = await Promise.all(
    (data.photos ?? []).map(async (p) => ({
      ...p,
      blob: await dataUrlToBlob(p.blob),
      thumbBlob: await dataUrlToBlob(p.thumbBlob),
    })),
  );
  await Promise.all([
    activityRepo.replaceAll(data.activities),
    noteRepo.replaceAll(data.notes ?? []),
    photoRepo.replaceAll(photos),
  ]);
  useSettingsStore.getState().update({ ...DEFAULT_SETTINGS, ...data.settings });
  useBadgeStore.getState().replaceAll(data.badges ?? []);
  return { activities: data.activities.length, notes: data.notes?.length ?? 0, photos: photos.length };
}

/** Deletes every activity, note, photo, badge and setting. */
export async function resetAll() {
  await Promise.all([activityRepo.clear(), noteRepo.clear(), photoRepo.clear()]);
  useBadgeStore.getState().reset();
  useSettingsStore.getState().reset();
}

export function backupFileName(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `stridelog-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}
