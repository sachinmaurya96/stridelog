import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Activity, Units } from '@/data/types';
import { ActivityCard } from '@/components/activities/ActivityCard';

export function RecentActivities({ activities, units }: { activities: Activity[]; units: Units }) {
  return (
    <section aria-labelledby="recent-title" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="recent-title" className="font-semibold">
          Recent activities
        </h2>
        <Link href="/activities" className="flex items-center gap-0.5 rounded-lg text-sm text-muted-foreground hover:text-foreground">
          See all <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {activities.map((a) => (
          <ActivityCard key={a.id} activity={a} units={units} />
        ))}
      </div>
    </section>
  );
}
