'use client';

import { useHydrated } from '@/hooks/useHydrated';
import { PageSkeleton } from './PageSkeleton';

/**
 * Renders `children` only after the client has mounted. Pages wrap their views in this,
 * because everything they show comes from localStorage / IndexedDB.
 */
export function ClientOnly({
  children,
  fallback = <PageSkeleton />,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return useHydrated() ? children : fallback;
}
