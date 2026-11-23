import { ClientOnly } from '@/components/layout/ClientOnly';
import { DashboardView } from '@/components/dashboard/DashboardView';

export default function Page() {
  return (
    <ClientOnly>
      <DashboardView />
    </ClientOnly>
  );
}
