import type { Metadata } from 'next';
import { Placeholder } from '@/components/layout/Placeholder';

export const metadata: Metadata = { title: 'Welcome' };

export default function Page() {
  return <Placeholder title="Welcome" />;
}
