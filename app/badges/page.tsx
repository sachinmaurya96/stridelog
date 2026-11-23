import type { Metadata } from 'next';
import { ClientOnly } from '@/components/layout/ClientOnly';
import { BadgesView } from '@/components/badges/BadgesView';

export const metadata: Metadata = { title: 'Badges' };

export default function Page() {
  return (
    <ClientOnly>
      <BadgesView />
    </ClientOnly>
  );
}
