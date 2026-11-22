import { db } from '../db';
import type { DailyNote } from '../types';

export interface NoteRepo {
  /** Newest date first. */
  list(): Promise<DailyNote[]>;
  get(date: string): Promise<DailyNote | undefined>;
  save(note: DailyNote): Promise<void>;
  remove(date: string): Promise<void>;
  count(): Promise<number>;
  /** All dates ('yyyy-MM-dd') that have a note. */
  dates(): Promise<string[]>;
  replaceAll(items: DailyNote[]): Promise<void>;
  clear(): Promise<void>;
}

export const localNoteRepo: NoteRepo = {
  list: () => db.notes.orderBy('date').reverse().toArray(),
  get: (date) => db.notes.get(date),
  async save(note) {
    await db.notes.put(note);
  },
  remove: (date) => db.notes.delete(date),
  count: () => db.notes.count(),
  dates: () => db.notes.toCollection().primaryKeys(),
  replaceAll: (items) =>
    db.transaction('rw', db.notes, async () => {
      await db.notes.clear();
      await db.notes.bulkPut(items);
    }),
  clear: () => db.notes.clear(),
};
