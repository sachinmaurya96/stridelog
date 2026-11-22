import { db } from '../db';
import type { Activity } from '../types';

export interface ActivityRepo {
  /** Newest first. `range` filters on `startedAt` (inclusive). */
  list(range?: { from: number; to: number }): Promise<Activity[]>;
  get(id: string): Promise<Activity | undefined>;
  save(a: Activity): Promise<void>;
  update(id: string, patch: Partial<Omit<Activity, 'id'>>): Promise<void>;
  remove(id: string): Promise<void>;
  count(): Promise<number>;
  replaceAll(items: Activity[]): Promise<void>;
  clear(): Promise<void>;
}

export const localActivityRepo: ActivityRepo = {
  list(range) {
    const coll = range
      ? db.activities.where('startedAt').between(range.from, range.to, true, true)
      : db.activities.orderBy('startedAt');
    return coll.reverse().toArray();
  },
  get: (id) => db.activities.get(id),
  async save(a) {
    await db.activities.put(a);
  },
  async update(id, patch) {
    await db.activities.update(id, patch);
  },
  remove: (id) => db.activities.delete(id),
  count: () => db.activities.count(),
  replaceAll: (items) =>
    db.transaction('rw', db.activities, async () => {
      await db.activities.clear();
      await db.activities.bulkPut(items);
    }),
  clear: () => db.activities.clear(),
};
