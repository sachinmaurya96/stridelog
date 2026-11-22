import type { Metadata } from 'next';
import { ClientOnly } from '@/components/layout/ClientOnly';
import { OnboardingFlow } from '@/components/settings/OnboardingFlow';

export const metadata: Metadata = { title: 'Welcome' };

export default function Page() {
  return (
    <ClientOnly fallback={null}>
      <OnboardingFlow />
    </ClientOnly>
  );
}
