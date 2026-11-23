import type { Rating } from '@/data/types';

export const MOODS: { value: Rating; emoji: string; label: string }[] = [
  { value: 1, emoji: '😞', label: 'Awful' },
  { value: 2, emoji: '🙁', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

export const moodFor = (value: number) => MOODS.find((m) => m.value === value) ?? MOODS[2];
