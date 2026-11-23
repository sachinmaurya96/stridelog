'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { vibrate } from '@/lib/haptics';

/** Full-screen 3‑2‑1 before recording starts. */
export function CountdownOverlay({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [n, setN] = useState(3);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (n === 0) {
      onDoneRef.current();
      return;
    }
    vibrate(30);
    const id = setTimeout(() => setN((x) => x - 1), 1000);
    return () => clearTimeout(id);
  }, [n]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Starting soon"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-10 bg-background/85 backdrop-blur-md"
    >
      <p className="text-lg font-medium text-muted-foreground">Get ready…</p>
      <div className="relative grid size-48 place-items-center" aria-live="assertive">
        <AnimatePresence mode="popLayout">
          {n > 0 && (
            <motion.span
              key={n}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="text-gradient-run text-[9rem] leading-none font-extrabold tabular-nums"
            >
              {n}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <Button variant="outline" size="lg" onClick={onCancel} autoFocus>
        Cancel
      </Button>
    </div>
  );
}
