'use client';

import { useEffect, useRef, useState } from 'react';
import type { ActivityType, GeoPoint } from '@/data/types';
import { RouteMap } from '@/components/map/MapClient';
import { ACTIVITY_META } from '@/components/common/activity';
import { cn } from '@/lib/utils';

/** Static route map that only mounts once it scrolls into view (long lists stay fast). */
export function LazyRouteThumb({ route, type, className }: { route: GeoPoint[]; type: ActivityType; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Icon = ACTIVITY_META[type].Icon;
  return (
    <div ref={ref} className={cn('relative overflow-hidden rounded-xl bg-muted', className)}>
      {route.length > 1 ? (
        visible && <RouteMap route={route} type={type} interactive={false} padding={10} className="size-full" />
      ) : (
        <div className="grid size-full place-items-center text-muted-foreground">
          <Icon className="size-6" aria-hidden />
        </div>
      )}
    </div>
  );
}
