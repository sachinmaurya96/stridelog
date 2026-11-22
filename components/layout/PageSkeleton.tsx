import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
  return (
    <div className="grid gap-4 py-2 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-40 rounded-2xl md:col-span-2 xl:col-span-3" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  );
}
