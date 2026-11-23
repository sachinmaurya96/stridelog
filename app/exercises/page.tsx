import type { Metadata } from 'next';
import { ClientOnly } from '@/components/layout/ClientOnly';
import { ExercisesView } from '@/components/exercises/ExercisesView';

export const metadata: Metadata = { title: 'Exercises' };

export default function Page() {
  return (
    <ClientOnly>
      <ExercisesView />
    </ClientOnly>
  );
}
