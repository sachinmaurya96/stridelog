// The UI only talks to these exports. To add a backend later, implement
// `apiActivityRepo` etc. with the same interfaces and swap them in here.
import { localActivityRepo, type ActivityRepo } from './activityRepo';
import { localNoteRepo, type NoteRepo } from './noteRepo';
import { localPhotoRepo, type PhotoRepo } from './photoRepo';

export const activityRepo: ActivityRepo = localActivityRepo;
export const noteRepo: NoteRepo = localNoteRepo;
export const photoRepo: PhotoRepo = localPhotoRepo;

export type { ActivityRepo, NoteRepo, PhotoRepo };
