import type { Metadata } from 'next';
import { ClientOnly } from '@/components/layout/ClientOnly';
import { SettingsView } from '@/components/settings/SettingsView';

export const metadata: Metadata = { title: 'Settings' };

export default function Page() {
  return (
    <ClientOnly>
      <SettingsView />
    </ClientOnly>
  );
}
