/** Allowed ranges for profile and goal values, shared by onboarding and settings. */
export const LIMITS = {
  weightKg: { min: 25, max: 250, step: 0.5 },
  heightCm: { min: 100, max: 250, step: 1 },
  dailyGoalSteps: { min: 1000, max: 50000, step: 500 },
  weeklyGoalActivities: { min: 1, max: 21, step: 1 },
  weeklyGoalKm: { min: 1, max: 300, step: 1 },
} as const;

export const NAME_MAX = 40;
