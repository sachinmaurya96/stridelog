import { db } from '../db';
import type { DailyPhoto } from '../types';

export interface PhotoRepo {
  /** Newest date first. */
  list(): Promise<DailyPhoto[]>;
  get(id: string): Promise<DailyPhoto | undefined>;
  getByDate(date: string): Promise<DailyPhoto | undefined>;
  save(photo: DailyPhoto): Promise<void>;
  update(id: string, patch: Partial<Pick<DailyPhoto, 'caption'>>): Promise<void>;
  remove(id: string): Promise<void>;
  count(): Promise<number>;
  /** Distinct dates ('yyyy-MM-dd') that have a photo. */
  dates(): Promise<string[]>;
  replaceAll(items: DailyPhoto[]): Promise<void>;
  clear(): Promise<void>;
}

export const localPhotoRepo: PhotoRepo = {
  list: () => db.photos.orderBy('date').reverse().toArray(),
  get: (id) => db.photos.get(id),
  getByDate: (date) => db.photos.where('date').equals(date).last(),
  async save(photo) {
    await db.photos.put(photo);
  },
  async update(id, patch) {
    await db.photos.update(id, patch);
  },
  remove: (id) => db.photos.delete(id),
  count: () => db.photos.count(),
  dates: () => db.photos.orderBy('date').uniqueKeys() as Promise<string[]>,
  replaceAll: (items) =>
    db.transaction('rw', db.photos, async () => {
      await db.photos.clear();
      await db.photos.bulkPut(items);
    }),
  clear: () => db.photos.clear(),
};
