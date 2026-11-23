import type { Metadata } from 'next';
import { ClientOnly } from '@/components/layout/ClientOnly';
import { ActivitiesView } from '@/components/activities/ActivitiesView';

export const metadata: Metadata = { title: 'Activities' };

export default function Page() {
  return (
    <ClientOnly>
      <ActivitiesView />
    </ClientOnly>
  );
}
