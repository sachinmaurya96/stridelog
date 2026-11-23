import { activityRepo, noteRepo, photoRepo } from './repositories';
import { buildBadgeContext, evaluateBadges } from '@/lib/badges';
import { useBadgeStore } from '@/store/badgeStore';

/**
 * Re-evaluates every badge against the stored data and unlocks the new ones,
 * which queues their celebration. Call after saving an activity, note or photo.
 */
export async function checkBadges(activityId?: string) {
  const [activities, notesCount, photosCount] = await Promise.all([
    activityRepo.list(),
    noteRepo.count(),
    photoRepo.count(),
  ]);
  const fresh = evaluateBadges(buildBadgeContext(activities, notesCount, photosCount), useBadgeStore.getState().unlocked);
  if (fresh.length) {
    const now = Date.now();
    useBadgeStore.getState().unlock(fresh.map((b) => ({ id: b.id, unlockedAt: now, activityId })));
  }
  return fresh;
}
