'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { vibrate } from '@/lib/haptics';

/** Full-screen 3‑2‑1 before recording starts. A modal dialog: focus stays inside, Escape cancels. */
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
    <AlertDialogPrimitive.Root open>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Content
          onEscapeKeyDown={onCancel}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-background/90 backdrop-blur-md outline-none"
        >
          <AlertDialogPrimitive.Title className="text-lg font-medium text-muted-foreground">Get ready…</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="sr-only">
            Recording starts in {n} {n === 1 ? 'second' : 'seconds'}. Press Escape to cancel.
          </AlertDialogPrimitive.Description>
          <div className="relative grid size-48 place-items-center" aria-hidden>
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
          <div className="flex gap-3">
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="outline" size="lg" onClick={onCancel} autoFocus>
                Cancel
              </Button>
            </AlertDialogPrimitive.Cancel>
            <Button size="lg" className="bg-run-gradient text-ink-on-accent hover:opacity-90" onClick={() => onDoneRef.current()}>
              Start now
            </Button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
