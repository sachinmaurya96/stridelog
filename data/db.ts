import Dexie, { type Table } from 'dexie';
import type { Activity, DailyNote, DailyPhoto } from './types';

class AppDB extends Dexie {
  activities!: Table<Activity, string>;
  notes!: Table<DailyNote, string>;
  photos!: Table<DailyPhoto, string>;
  constructor() {
    super('stridelog');
    this.version(1).stores({
      activities: 'id, type, startedAt',
      notes: 'date, updatedAt',
      photos: 'id, date, createdAt',
    });
  }
}

export const db = new AppDB();
