import Dexie, { type Table } from 'dexie';
import type { Activity, DailyNote, DailyPhoto, DayLog } from './types';

class AppDB extends Dexie {
  activities!: Table<Activity, string>;
  notes!: Table<DailyNote, string>;
  photos!: Table<DailyPhoto, string>;
  days!: Table<DayLog, string>;
  constructor() {
    super('stridelog');
    this.version(1).stores({
      activities: 'id, type, startedAt',
      notes: 'date, updatedAt',
      photos: 'id, date, createdAt',
    });
    // v2: daily log for water, sleep, exercises and the task checklist.
    this.version(2).stores({
      days: 'date',
    });
  }
}

export const db = new AppDB();
