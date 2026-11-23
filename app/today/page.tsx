import type { Metadata } from 'next';
import { ClientOnly } from '@/components/layout/ClientOnly';
import { TodayView } from '@/components/today/TodayView';

export const metadata: Metadata = { title: 'Today' };

export default function Page() {
  return (
    <ClientOnly>
      <TodayView />
    </ClientOnly>
  );
}
