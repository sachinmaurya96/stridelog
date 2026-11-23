import type { Metadata } from 'next';
import { ClientOnly } from '@/components/layout/ClientOnly';
import { CalendarView } from '@/components/calendar/CalendarView';

export const metadata: Metadata = { title: 'Calendar' };

export default function Page() {
  return (
    <ClientOnly>
      <CalendarView />
    </ClientOnly>
  );
}
