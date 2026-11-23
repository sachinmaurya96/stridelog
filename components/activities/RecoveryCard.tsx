import { Droplets, GlassWater, Info, Utensils } from 'lucide-react';
import type { Activity } from '@/data/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { recoveryPlan, suggestMeals } from '@/lib/wellness';

/** How much to drink and eat after this activity, with simple meal ideas. */
export function RecoveryCard({ activity, weightKg }: { activity: Activity; weightKg: number }) {
  const plan = recoveryPlan(activity, weightKg);
  const meals = suggestMeals(plan.carbsG, plan.proteinG);
  const glasses = Math.max(1, Math.round(plan.waterMl / 250));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="size-4 text-walk-ink" aria-hidden />
          Recovery: water &amp; food
        </CardTitle>
        <CardDescription>Based on this {activity.type} and your weight ({weightKg} kg).</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/60 px-3 py-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <GlassWater className="size-3.5" aria-hidden /> Drink
            </div>
            <div className="text-xl font-bold">{(plan.waterMl / 1000).toFixed(2).replace(/0$/, '')} L</div>
            <div className="text-xs text-muted-foreground">
              ≈ {glasses} {glasses === 1 ? 'glass' : 'glasses'} over 2–3 h
            </div>
          </div>
          <div className="rounded-xl bg-muted/60 px-3 py-2">
            <div className="text-xs text-muted-foreground">Carbs</div>
            <div className="text-xl font-bold">{plan.carbsG} g</div>
            <div className="text-xs text-muted-foreground">{plan.when}</div>
          </div>
          <div className="rounded-xl bg-muted/60 px-3 py-2">
            <div className="text-xs text-muted-foreground">Protein</div>
            <div className="text-xl font-bold">{plan.proteinG} g</div>
            <div className="text-xs text-muted-foreground">{plan.when}</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          You lost roughly <span className="font-semibold text-foreground">{(plan.sweatMl / 1000).toFixed(1)} L</span> of sweat and burned{' '}
          <span className="font-semibold text-foreground">{activity.calories} kcal</span>.
          {plan.electrolytes && ' After a long or sweaty session, add electrolytes: ORS, coconut water, or a pinch of salt in lemon water.'}
        </p>
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Utensils className="size-4" aria-hidden /> Meal ideas
          </h3>
          <ul className="flex flex-col gap-1.5">
            {meals.map((m) => (
              <li key={m.name} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm">
                <span>{m.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  ~{m.carbsG} g carbs · {m.proteinG} g protein
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="flex gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          General guidance, not medical advice. Drink more in hot weather, and check with a doctor or dietitian if you have a health condition.
        </p>
      </CardContent>
    </Card>
  );
}
