import { HeartPulse, PersonStanding, StretchHorizontal, Target, type LucideIcon } from 'lucide-react';
import type { ExerciseCategory } from '@/data/exercises';

export const CATEGORY_ICON: Record<ExerciseCategory, LucideIcon> = {
  strength: PersonStanding,
  core: Target,
  cardio: HeartPulse,
  mobility: StretchHorizontal,
};

export const CATEGORY_TINT: Record<ExerciseCategory, string> = {
  strength: 'bg-run-gradient',
  core: 'bg-gold-gradient',
  cardio: 'bg-[linear-gradient(135deg,#ff7aa2,#ff3d71)]',
  mobility: 'bg-walk-gradient',
};
