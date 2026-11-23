// The UI only talks to these exports. To add a backend later, implement
// `apiActivityRepo` etc. with the same interfaces and swap them in here.
import { localActivityRepo, type ActivityRepo } from './activityRepo';
import { localDayLogRepo, type DayLogRepo } from './dayLogRepo';
import { localNoteRepo, type NoteRepo } from './noteRepo';
import { localPhotoRepo, type PhotoRepo } from './photoRepo';

export const activityRepo: ActivityRepo = localActivityRepo;
export const noteRepo: NoteRepo = localNoteRepo;
export const photoRepo: PhotoRepo = localPhotoRepo;
export const dayLogRepo: DayLogRepo = localDayLogRepo;

export type { ActivityRepo, DayLogRepo, NoteRepo, PhotoRepo };
export { emptyDayLog } from './dayLogRepo';
