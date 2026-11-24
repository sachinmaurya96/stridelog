// Bodyweight exercises that need no equipment, chosen to complement running and walking.
import type { ExerciseId } from './exerciseVisuals';

export type ExerciseCategory = 'strength' | 'core' | 'cardio' | 'mobility';

export interface Exercise {
  id: ExerciseId;
  name: string;
  category: ExerciseCategory;
  muscles: string[];
  level: 'Beginner' | 'Intermediate';
  /** Suggested amount, e.g. "3 × 12 reps". */
  dose: string;
  steps: string[];
  /** Why it helps runners / a form cue. */
  tip: string;
  easier?: string;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  exercises: string[];
  workSec: number;
  restSec: number;
}

export const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  strength: 'Strength',
  core: 'Core',
  cardio: 'Cardio',
  mobility: 'Mobility',
};

export const EXERCISES: Exercise[] = [
  {
    id: 'squat',
    name: 'Bodyweight squat',
    category: 'strength',
    muscles: ['Quads', 'Glutes', 'Hamstrings'],
    level: 'Beginner',
    dose: '3 × 15 reps',
    steps: [
      'Stand with feet shoulder-width apart, toes slightly out.',
      'Push your hips back and bend your knees as if sitting into a chair.',
      'Go down until your thighs are about parallel to the floor, chest up.',
      'Drive through your heels to stand back up.',
    ],
    tip: 'Keep your knees tracking over your toes. Strong quads protect your knees on downhills.',
    easier: 'Squat down to a chair and stand back up.',
  },
  {
    id: 'reverse-lunge',
    name: 'Reverse lunge',
    category: 'strength',
    muscles: ['Quads', 'Glutes', 'Balance'],
    level: 'Beginner',
    dose: '3 × 10 per leg',
    steps: [
      'Stand tall with feet hip-width apart.',
      'Step one foot back and lower until both knees bend to about 90°.',
      'Keep your front knee over your ankle.',
      'Push through the front heel to return and switch legs.',
    ],
    tip: 'Single-leg work builds the stability you use on every running stride.',
    easier: 'Hold a wall or chair for balance and take a shorter step.',
  },
  {
    id: 'side-lunge',
    name: 'Side lunge',
    category: 'strength',
    muscles: ['Inner thighs', 'Glutes', 'Quads'],
    level: 'Beginner',
    dose: '3 × 10 per side',
    steps: [
      'Stand with feet wide apart.',
      'Shift your weight to one side, bending that knee and keeping the other leg straight.',
      'Push your hips back and keep your chest up.',
      'Push back to the middle and repeat on the other side.',
    ],
    tip: 'Runners mostly move forward; side-to-side strength helps prevent hip and knee niggles.',
  },
  {
    id: 'push-up',
    name: 'Push-up',
    category: 'strength',
    muscles: ['Chest', 'Shoulders', 'Triceps', 'Core'],
    level: 'Intermediate',
    dose: '3 × 8–12 reps',
    steps: [
      'Start in a high plank with hands slightly wider than your shoulders.',
      'Keep your body in a straight line from head to heels.',
      'Lower your chest towards the floor with elbows at about 45°.',
      'Push back up to the start.',
    ],
    tip: 'A strong upper body keeps your arm swing efficient late in a run.',
    easier: 'Do them with your knees on the floor or hands on a table.',
  },
  {
    id: 'glute-bridge',
    name: 'Glute bridge',
    category: 'strength',
    muscles: ['Glutes', 'Hamstrings', 'Lower back'],
    level: 'Beginner',
    dose: '3 × 15 reps',
    steps: [
      'Lie on your back with knees bent and feet flat, hip-width apart.',
      'Squeeze your glutes and lift your hips until your body forms a straight line from shoulders to knees.',
      'Pause for a second at the top.',
      'Lower slowly.',
    ],
    tip: 'Strong glutes are the engine of running and help prevent knee pain.',
  },
  {
    id: 'single-leg-deadlift',
    name: 'Single-leg deadlift',
    category: 'strength',
    muscles: ['Hamstrings', 'Glutes', 'Balance'],
    level: 'Intermediate',
    dose: '3 × 8 per leg',
    steps: [
      'Stand on one leg with a soft knee.',
      'Hinge at the hips, reaching your hands towards the floor as the other leg lifts behind you.',
      'Keep your back flat and hips level.',
      'Return to standing by squeezing the glute of the standing leg.',
    ],
    tip: 'Builds ankle stability and hamstring strength for a stronger push-off.',
    easier: 'Lightly touch a wall with one hand.',
  },
  {
    id: 'calf-raise',
    name: 'Calf raise',
    category: 'strength',
    muscles: ['Calves', 'Ankles'],
    level: 'Beginner',
    dose: '3 × 20 reps',
    steps: [
      'Stand tall with feet hip-width apart, holding a wall for balance if needed.',
      'Rise onto the balls of your feet as high as you can.',
      'Pause, then lower slowly over 2–3 seconds.',
    ],
    tip: 'Strong calves and Achilles tendons handle the impact of every step.',
  },
  {
    id: 'wall-sit',
    name: 'Wall sit',
    category: 'strength',
    muscles: ['Quads', 'Glutes'],
    level: 'Beginner',
    dose: '3 × 30–45 s',
    steps: [
      'Lean your back flat against a wall.',
      'Slide down until your knees are bent at about 90°.',
      'Hold, keeping your weight in your heels.',
    ],
    tip: 'Builds the muscular endurance your legs need for longer runs.',
  },
  {
    id: 'superman',
    name: 'Superman',
    category: 'strength',
    muscles: ['Lower back', 'Glutes', 'Shoulders'],
    level: 'Beginner',
    dose: '3 × 12 reps',
    steps: [
      'Lie face down with arms stretched out in front.',
      'Lift your arms, chest and legs a few centimetres off the floor.',
      'Hold for 2 seconds, then lower.',
    ],
    tip: 'A strong back helps you keep good posture when you get tired.',
  },
  {
    id: 'plank',
    name: 'Plank',
    category: 'core',
    muscles: ['Core', 'Shoulders'],
    level: 'Beginner',
    dose: '3 × 30–60 s',
    steps: [
      'Rest on your forearms with elbows under your shoulders.',
      'Lift your hips so your body is a straight line from head to heels.',
      'Brace your stomach and breathe steadily.',
    ],
    tip: 'A stable core stops energy leaking through side-to-side movement.',
    easier: 'Keep your knees on the floor.',
  },
  {
    id: 'side-plank',
    name: 'Side plank',
    category: 'core',
    muscles: ['Obliques', 'Hips'],
    level: 'Intermediate',
    dose: '2 × 30 s per side',
    steps: [
      'Lie on your side, propped on one forearm with the elbow under the shoulder.',
      'Stack your feet and lift your hips into a straight line.',
      'Hold, then switch sides.',
    ],
    tip: 'Strengthens the hip muscles that keep your pelvis level while running.',
    easier: 'Bend your knees and keep them on the floor.',
  },
  {
    id: 'dead-bug',
    name: 'Dead bug',
    category: 'core',
    muscles: ['Deep core', 'Hip flexors'],
    level: 'Beginner',
    dose: '3 × 10 per side',
    steps: [
      'Lie on your back with arms pointing to the ceiling and knees bent at 90° above your hips.',
      'Press your lower back into the floor.',
      'Slowly lower the opposite arm and leg towards the floor, then return.',
      'Alternate sides.',
    ],
    tip: 'Teaches your core to stay stable while your arms and legs move, just like running.',
  },
  {
    id: 'bird-dog',
    name: 'Bird dog',
    category: 'core',
    muscles: ['Core', 'Lower back', 'Glutes'],
    level: 'Beginner',
    dose: '3 × 10 per side',
    steps: [
      'Start on hands and knees, hands under shoulders and knees under hips.',
      'Reach one arm forward and the opposite leg back until both are level with your body.',
      'Hold for 2 seconds without twisting, then switch.',
    ],
    tip: 'Great for balance and a healthy lower back.',
  },
  {
    id: 'bicycle-crunch',
    name: 'Bicycle crunch',
    category: 'core',
    muscles: ['Abs', 'Obliques'],
    level: 'Intermediate',
    dose: '3 × 20 total',
    steps: [
      'Lie on your back with hands lightly behind your head and legs raised.',
      'Bring one knee in while rotating the opposite elbow towards it.',
      'Switch sides in a slow pedalling motion.',
    ],
    tip: 'Move slowly and keep your lower back down; quality beats speed.',
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping jacks',
    category: 'cardio',
    muscles: ['Full body', 'Heart'],
    level: 'Beginner',
    dose: '3 × 45 s',
    steps: [
      'Stand with feet together and arms by your sides.',
      'Jump your feet out while raising your arms overhead.',
      'Jump back to the start and repeat at a steady rhythm.',
    ],
    tip: 'A quick warm-up that raises your heart rate on rest days.',
    easier: 'Step one foot out at a time instead of jumping.',
  },
  {
    id: 'high-knees',
    name: 'High knees',
    category: 'cardio',
    muscles: ['Hip flexors', 'Calves', 'Heart'],
    level: 'Beginner',
    dose: '3 × 30 s',
    steps: [
      'Run on the spot, driving your knees up to hip height.',
      'Land softly on the balls of your feet.',
      'Pump your arms as you would when running.',
    ],
    tip: 'Improves cadence and knee drive.',
    easier: 'March on the spot with high knees.',
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain climbers',
    category: 'cardio',
    muscles: ['Core', 'Shoulders', 'Hip flexors'],
    level: 'Intermediate',
    dose: '3 × 30 s',
    steps: [
      'Start in a high plank with hands under your shoulders.',
      'Drive one knee towards your chest, then quickly switch legs.',
      'Keep your hips low and your back flat.',
    ],
    tip: 'Cardio and core in one; keep the pace you can hold with good form.',
  },
  {
    id: 'skater-hops',
    name: 'Skater hops',
    category: 'cardio',
    muscles: ['Glutes', 'Ankles', 'Balance'],
    level: 'Intermediate',
    dose: '3 × 30 s',
    steps: [
      'Hop sideways onto one foot, swinging the other leg behind you.',
      'Land softly with a bent knee and hold for a moment.',
      'Hop back to the other side.',
    ],
    tip: 'Builds springy, stable ankles for uneven ground.',
    easier: 'Step side to side instead of hopping.',
  },
  {
    id: 'burpee',
    name: 'Burpee',
    category: 'cardio',
    muscles: ['Full body', 'Heart'],
    level: 'Intermediate',
    dose: '3 × 8 reps',
    steps: [
      'From standing, squat and place your hands on the floor.',
      'Jump or step your feet back into a plank.',
      'Bring your feet back towards your hands.',
      'Stand up and finish with a small jump.',
    ],
    tip: 'Hard but efficient. Use the step-back version until you are comfortable.',
    easier: 'Step back and forward instead of jumping, and skip the jump at the end.',
  },
  {
    id: 'leg-swings',
    name: 'Leg swings',
    category: 'mobility',
    muscles: ['Hips', 'Hamstrings'],
    level: 'Beginner',
    dose: '15 per leg, each direction',
    steps: [
      'Hold a wall for balance and stand on one leg.',
      'Swing the other leg forward and back in a relaxed, controlled way.',
      'Then swing it side to side across your body.',
    ],
    tip: 'A perfect dynamic warm-up before a run.',
  },
  {
    id: 'hip-flexor-stretch',
    name: 'Kneeling hip flexor stretch',
    category: 'mobility',
    muscles: ['Hip flexors', 'Quads'],
    level: 'Beginner',
    dose: '2 × 30 s per side',
    steps: [
      'Kneel on one knee with the other foot in front, both knees at 90°.',
      'Tuck your pelvis under and gently shift forward until you feel a stretch at the front of the hip.',
      'Hold and breathe, then switch sides.',
    ],
    tip: 'Sitting all day tightens hip flexors; this keeps your stride long.',
  },
  {
    id: 'cat-cow',
    name: 'Cat–cow',
    category: 'mobility',
    muscles: ['Spine', 'Back'],
    level: 'Beginner',
    dose: '10 slow breaths',
    steps: [
      'Start on hands and knees.',
      'Breathe in as you drop your belly and lift your chest (cow).',
      'Breathe out as you round your back towards the ceiling (cat).',
    ],
    tip: 'Loosens your back after a long run or a long day at a desk.',
  },
  {
    id: 'worlds-greatest-stretch',
    name: "World's greatest stretch",
    category: 'mobility',
    muscles: ['Hips', 'Hamstrings', 'Upper back'],
    level: 'Beginner',
    dose: '5 per side',
    steps: [
      'Step into a deep lunge and place both hands on the floor inside the front foot.',
      'Drop the elbow on that side towards the floor.',
      'Rotate and reach the same arm to the ceiling, following it with your eyes.',
      'Return and switch sides.',
    ],
    tip: 'Hits hips, hamstrings and back in one move. Great before or after running.',
  },
];

export const ROUTINES: Routine[] = [
  {
    id: 'runner-strength',
    name: "Runner's strength",
    description: 'Legs, glutes and core: the muscles that keep runners injury-free.',
    exercises: ['squat', 'reverse-lunge', 'glute-bridge', 'single-leg-deadlift', 'calf-raise', 'plank', 'side-plank'],
    workSec: 40,
    restSec: 20,
  },
  {
    id: 'core',
    name: 'Core in 6',
    description: 'A short core session you can do anywhere.',
    exercises: ['plank', 'dead-bug', 'bird-dog', 'bicycle-crunch', 'side-plank', 'superman'],
    workSec: 45,
    restSec: 15,
  },
  {
    id: 'cardio',
    name: 'Rest-day cardio',
    description: 'Get your heart rate up without leaving the room.',
    exercises: ['jumping-jacks', 'high-knees', 'mountain-climbers', 'skater-hops', 'burpee', 'jumping-jacks'],
    workSec: 30,
    restSec: 15,
  },
  {
    id: 'warm-up',
    name: 'Pre-run warm-up',
    description: 'Loosen up and get the blood flowing before you head out.',
    exercises: ['leg-swings', 'high-knees', 'worlds-greatest-stretch', 'jumping-jacks'],
    workSec: 40,
    restSec: 10,
  },
  {
    id: 'cool-down',
    name: 'Post-run stretch',
    description: 'Gentle mobility to help you recover after a run.',
    exercises: ['hip-flexor-stretch', 'worlds-greatest-stretch', 'cat-cow', 'glute-bridge'],
    workSec: 45,
    restSec: 10,
  },
];

export const exerciseById = (id: string) => EXERCISES.find((e) => e.id === id);

export const routineMinutes = (r: Routine) => Math.round((r.exercises.length * (r.workSec + r.restSec)) / 60);
