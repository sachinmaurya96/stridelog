import Link from 'next/link';
import { BedDouble, Dumbbell, Footprints, GlassWater, Info, Salad } from 'lucide-react';
import type { Units } from '@/data/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { distanceValue } from '@/lib/format';
import type { DailyTargets } from '@/lib/wellness';

/** "How much do I need?" — daily targets for movement, exercise, water, food and sleep. */
export function TargetsCard({
  targets,
  profile,
  units,
}: {
  targets: DailyTargets;
  profile: { weightKg: number; heightCm: number; age: number };
  units: Units;
}) {
  const walkKm = distanceValue(targets.steps * ((profile.heightCm * 0.415) / 100), units);
  const rows = [
    {
      icon: Footprints,
      title: 'Move',
      value: `${targets.steps.toLocaleString()} steps`,
      detail: `≈ ${walkKm.toFixed(1)} ${units} a day, or at least ${targets.activeMinutes} min of brisk walking or running on 5 days (150–300 min a week).`,
    },
    {
      icon: Dumbbell,
      title: 'Exercise',
      value: `${targets.exercises} exercises`,
      detail: 'A 10–15 minute bodyweight routine. Do strength work on at least 2 days a week.',
    },
    {
      icon: GlassWater,
      title: 'Water',
      value: `${(targets.waterMl / 1000).toFixed(1)} L`,
      detail: 'About 35 ml per kg of body weight, plus what you sweat out in workouts. More on hot days.',
    },
    {
      icon: Salad,
      title: 'Food',
      value: `~${targets.kcal.toLocaleString()} kcal`,
      detail: `To maintain your weight today. Protein ${targets.proteinG.min}–${targets.proteinG.max} g, carbs ${targets.carbsG.min}–${targets.carbsG.max} g, and 5 servings of fruit & vegetables.`,
    },
    {
      icon: BedDouble,
      title: 'Sleep',
      value: `${targets.sleepH.min}–${targets.sleepH.max} h`,
      detail: 'Recovery happens while you sleep. Keep a regular bedtime.',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>How much you need each day</CardTitle>
        <CardDescription>
          Based on {profile.weightKg} kg, {profile.heightCm} cm, age {profile.age} and today&apos;s workouts.{' '}
          <Link href="/settings" className="underline underline-offset-2">
            Update profile
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.title} className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                <r.icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{r.title}</span>
                  <span className="font-bold tabular-nums">{r.value}</span>
                </p>
                <p className="text-sm text-muted-foreground">{r.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="flex gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          General guidance from public health and sports-nutrition guidelines, not medical advice. If you have a health
          condition, are pregnant, or want to lose or gain weight, ask a doctor or dietitian.
        </p>
      </CardContent>
    </Card>
  );
}
