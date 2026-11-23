'use client';

import { useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { format } from 'date-fns';
import { DayCell, type DayInfo } from './DayCell';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Month grid (Monday first). Swipe left/right on touch screens to change month. */
export function MonthCalendar({
  month,
  days,
  direction,
  onSelect,
  onPrev,
  onNext,
}: {
  month: Date;
  days: DayInfo[];
  direction: number;
  onSelect: (d: DayInfo) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const touch = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const dx = e.changedTouches[0].clientX - touch.current.x;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        touch.current = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx < 0) onNext();
          else onPrev();
        }
      }}
      className="overflow-hidden"
    >
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground" aria-hidden>
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={format(month, 'yyyy-MM')}
          custom={direction}
          initial={{ x: direction * 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction * -40, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="grid grid-cols-7 gap-1"
          aria-label={format(month, 'MMMM yyyy')}
          role="group"
        >
          {days.map((d) => (
            <DayCell key={d.key} day={d} onSelect={onSelect} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
