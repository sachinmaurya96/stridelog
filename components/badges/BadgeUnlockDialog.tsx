'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { badgeById } from '@/lib/badges';
import { vibrate } from '@/lib/haptics';
import { useBadgeStore } from '@/store/badgeStore';
import { BadgeMedal, TIER_LABEL } from './BadgeMedal';

const COLORS = ['#ff6b35', '#ff3d71', '#00d4aa', '#00b4d8', '#ffc94d'];

function celebrate() {
  const base = { particleCount: 70, spread: 70, startVelocity: 45, colors: COLORS, zIndex: 100, disableForReducedMotion: true };
  void confetti({ ...base, angle: 60, origin: { x: 0, y: 0.7 } });
  void confetti({ ...base, angle: 120, origin: { x: 1, y: 0.7 } });
}

/** Shows queued badge unlocks one after another, each with confetti. */
export function BadgeUnlockDialog() {
  const queue = useBadgeStore((s) => s.queue);
  const dismiss = useBadgeStore((s) => s.dismiss);
  const reduceMotion = useReducedMotion();
  const badge = queue[0] ? badgeById(queue[0]) : undefined;
  const remaining = queue.length - 1;

  useEffect(() => {
    if (!badge) return;
    vibrate([60, 40, 60]);
    if (!reduceMotion) celebrate();
  }, [badge, reduceMotion]);

  return (
    <Dialog open={!!badge} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent showCloseButton={false} className="max-w-sm overflow-hidden rounded-3xl p-0">
        {badge && (
          <div key={badge.id} className="flex flex-col items-center gap-4 px-6 pt-8 pb-6 text-center">
            <div className="text-xs font-semibold tracking-widest text-gold-ink uppercase">Badge unlocked</div>
            <motion.div
              initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            >
              <BadgeMedal icon={badge.icon} tier={badge.tier} className="size-32" />
            </motion.div>
            <DialogHeader className="items-center">
              <DialogTitle className="text-2xl font-bold">{badge.name}</DialogTitle>
              <DialogDescription>{badge.description}</DialogDescription>
            </DialogHeader>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {TIER_LABEL[badge.tier]} badge
            </span>
            <DialogFooter className="w-full sm:justify-center">
              <Button size="lg" className="w-full bg-run-gradient text-ink-on-accent hover:opacity-90" onClick={dismiss} autoFocus>
                Nice!{remaining > 0 ? ` (${remaining} more)` : ''}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
