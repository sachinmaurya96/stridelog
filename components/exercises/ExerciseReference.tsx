import { useId } from 'react';
import { EXERCISE_VISUALS, type ExercisePose, type Point } from '@/data/exerciseVisuals';
import type { Exercise } from '@/data/exercises';
import { cn } from '@/lib/utils';

function path(points: readonly Point[]) {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
}

/** A shared, static drawing keeps every reference sharp and available offline. */
function Pose({ pose }: { pose: ExercisePose }) {
  const { head, shoulder, hip, arms, legs } = pose;
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="140" cy="224" rx="112" ry="5" fill="#dcebe9" />
      <path d="M16 220H264" stroke="#c5d9d6" strokeWidth="2" />
      {pose.wall && <path d="M51 25V220M43 25V220" stroke="#a6c7c2" strokeWidth="4" />}
      {([0, 1] as const).map((i) => (
        <g key={`leg-${i}`}>
          <path d={path([hip, ...legs[i]])} fill="none" stroke={i ? '#c58a67' : '#a96e50'} strokeWidth="14" />
          <path d={path([hip, [(hip[0] + legs[i][0][0]) / 2, (hip[1] + legs[i][0][1]) / 2]])} stroke={i ? '#243d53' : '#3c566b'} strokeWidth="21" />
          <path d={path([legs[i][1], pose.toes?.[i] ?? [legs[i][1][0] + 11, Math.min(217, legs[i][1][1] + 5)]])} stroke="#243d53" strokeWidth="11" />
        </g>
      ))}
      <path d={path([shoulder, [head[0], head[1] + 7]])} stroke="#c58a67" strokeWidth="14" />
      <path d={pose.spine ?? path([shoulder, hip])} fill="none" stroke="#0d7b78" strokeWidth="29" />
      {([0, 1] as const).map((i) => (
        <g key={`arm-${i}`}>
          <path d={path([shoulder, ...arms[i]])} fill="none" stroke={i ? '#d49a76' : '#b87e5b'} strokeWidth="11" />
          <path d={path([shoulder, [(shoulder[0] + arms[i][0][0]) / 2, (shoulder[1] + arms[i][0][1]) / 2]])} stroke={i ? '#15938a' : '#0b6968'} strokeWidth="17" />
          <circle cx={arms[i][1][0]} cy={arms[i][1][1]} r="6" fill={i ? '#d49a76' : '#b87e5b'} />
        </g>
      ))}
      <circle cx={head[0]} cy={head[1]} r="14" fill="#d49a76" />
      <path d={`M${head[0] - 13} ${head[1] - 2}a13 13 0 0 1 26 -2l-7 -5 -10 3Z`} fill="#243d53" />
    </g>
  );
}

export function ExerciseReference({
  exercise,
  compact = false,
  className,
}: {
  exercise: Exercise;
  compact?: boolean;
  className?: string;
}) {
  const titleId = useId();
  const visual = EXERCISE_VISUALS[exercise.id];

  if (compact) {
    const position = visual.positions[1];
    return (
      <svg viewBox="0 0 280 240" aria-hidden="true" className={cn('rounded-xl bg-[#f0f7f6]', className)}>
        <Pose pose={position.pose} />
      </svg>
    );
  }

  return (
    <figure className={cn('w-full overflow-hidden rounded-2xl border border-border bg-[#f0f7f6] text-[#183b3a]', className)}>
      <figcaption className="flex items-center justify-between gap-2 px-4 pt-3 text-sm font-semibold">
        <span>Movement guide</span>
        <span className="font-normal text-[#476562]">{visual.positions.length} positions</span>
      </figcaption>
      <div className="grid grid-cols-2 gap-x-2 gap-y-4 p-3">
        {visual.positions.map((position, i) => (
          <div key={position.label} className="min-w-0">
            <svg viewBox="0 0 280 240" role="img" aria-labelledby={`${titleId}-${i}`} className="mx-auto block w-full max-w-64">
              <title id={`${titleId}-${i}`}>{exercise.name}: {position.description}</title>
              <Pose pose={position.pose} />
            </svg>
            <p className="flex items-start justify-center gap-1.5 text-center text-sm font-semibold">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#0d7b78] text-xs text-white" aria-hidden>{i + 1}</span>
              <span>{position.label}</span>
            </p>
          </div>
        ))}
      </div>
      <p className="border-t border-[#d1e3df] px-4 py-3 text-left text-sm leading-relaxed">{visual.cue}</p>
    </figure>
  );
}
