import type { Metadata } from 'next';
import { Placeholder } from '@/components/layout/Placeholder';

export const metadata: Metadata = { title: 'Dashboard' };

export default function Page() {
  return <Placeholder title="Dashboard" />;
}
