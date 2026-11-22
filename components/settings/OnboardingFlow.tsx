'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, type PanInfo } from 'motion/react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberStepper } from '@/components/common/NumberStepper';
import { Logo } from '@/components/layout/Logo';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';
import { LIMITS, NAME_MAX } from './fields';

const STEPS = [
  { title: "Hi! What's your name?", subtitle: "We'll use it to greet you." },
  { title: 'Your body', subtitle: 'Needed to estimate calories and steps. It never leaves this device.' },
  { title: 'Set your goals', subtitle: 'You can change these any time in Settings.' },
];

export function OnboardingFlow() {
  const router = useRouter();
  const settings = useSettingsStore();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState(settings.name);
  const [weightKg, setWeightKg] = useState(settings.weightKg);
  const [heightCm, setHeightCm] = useState(settings.heightCm);
  const [dailyGoalSteps, setDailyGoalSteps] = useState(settings.dailyGoalSteps);
  const [weeklyGoalActivities, setWeeklyGoalActivities] = useState(settings.weeklyGoalActivities);
  const [weeklyGoalKm, setWeeklyGoalKm] = useState(settings.weeklyGoalKm);
  const [touched, setTouched] = useState(false);

  const nameError = name.trim() ? null : 'Please enter your name';
  const last = step === STEPS.length - 1;

  function go(to: number) {
    if (to > step && step === 0 && nameError) {
      setTouched(true);
      return;
    }
    if (to < 0 || to >= STEPS.length) return;
    setDirection(to > step ? 1 : -1);
    setStep(to);
  }

  function finish() {
    settings.update({
      name: name.trim(),
      weightKg,
      heightCm,
      dailyGoalSteps,
      weeklyGoalActivities,
      weeklyGoalKm,
      onboarded: true,
    });
    router.replace('/');
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -80) go(step + 1);
    else if (info.offset.x > 80) go(step - 1);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-safe pb-safe">
      <div className="flex items-center justify-between py-6">
        <Logo />
        <span className="text-sm text-muted-foreground tabular-nums">
          Step {step + 1} of {STEPS.length}
        </span>
      </div>

      <div className="mb-6 flex gap-2" aria-hidden>
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={cn('h-1.5 flex-1 rounded-full bg-muted transition-colors', i <= step && 'bg-run-gradient')}
          />
        ))}
      </div>

      <form
        className="relative flex flex-1 flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          if (last) finish();
          else go(step + 1);
        }}
      >
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.section
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={onDragEnd}
              aria-labelledby="onboarding-title"
              className="glass flex flex-col gap-6 rounded-3xl p-6"
            >
              <div>
                <h1 id="onboarding-title" className="text-2xl font-bold tracking-tight">
                  {STEPS[step].title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">{STEPS[step].subtitle}</p>
              </div>

              {step === 0 && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    autoFocus
                    autoComplete="given-name"
                    maxLength={NAME_MAX}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="e.g. Shivam"
                    aria-invalid={touched && !!nameError}
                    aria-describedby="name-error"
                    className="text-lg"
                  />
                  <p id="name-error" className="min-h-5 text-sm text-destructive" role="alert">
                    {touched ? nameError : ''}
                  </p>
                </div>
              )}

              {step === 1 && (
                <>
                  <NumberStepper id="weight" label="Weight" unit="kg" value={weightKg} onChange={setWeightKg} {...LIMITS.weightKg} />
                  <NumberStepper id="height" label="Height" unit="cm" value={heightCm} onChange={setHeightCm} {...LIMITS.heightCm} />
                </>
              )}

              {step === 2 && (
                <>
                  <NumberStepper id="daily-steps" label="Daily steps" unit="steps" value={dailyGoalSteps} onChange={setDailyGoalSteps} {...LIMITS.dailyGoalSteps} />
                  <NumberStepper id="weekly-activities" label="Activities per week" value={weeklyGoalActivities} onChange={setWeeklyGoalActivities} {...LIMITS.weeklyGoalActivities} />
                  <NumberStepper id="weekly-km" label="Distance per week" unit="km" value={weeklyGoalKm} onChange={setWeeklyGoalKm} {...LIMITS.weeklyGoalKm} />
                </>
              )}
            </motion.section>
          </AnimatePresence>
        </div>

        <div className="flex gap-3 py-6">
          {step > 0 && (
            <Button type="button" variant="outline" size="lg" onClick={() => go(step - 1)}>
              <ArrowLeft aria-hidden /> Back
            </Button>
          )}
          <Button type="submit" size="lg" className="flex-1 bg-run-gradient text-ink-on-accent hover:opacity-90">
            {last ? (
              <>
                Let&apos;s go <Check aria-hidden />
              </>
            ) : (
              <>
                Next <ArrowRight aria-hidden />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
