'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { EXERCISE_VISUALS, type Point } from '@/data/exerciseVisuals';
import type { Exercise } from '@/data/exercises';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { buildTimeline, positionAt, resolvePose, type MotionTimeline, type ResolvedPose } from '@/lib/exerciseMotion';
import { cn } from '@/lib/utils';

const n = (v: number) => Math.round(v * 10) / 10;

function path(points: readonly Point[]) {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${n(x)} ${n(y)}`).join(' ');
}

function dot([x, y]: Point, r: number) {
  return `M${n(x - r)} ${n(y)}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
}

const half = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

interface Shape {
  d: string;
  fill?: string;
  stroke?: string;
  width?: number;
}

/** The body parts in drawing order; every pose yields the same list so they can be animated. */
function shapes(pose: ResolvedPose): Shape[] {
  const { head, shoulder, hip, arms, legs, toes, bend } = pose;
  return [
    ...([0, 1] as const).flatMap((i) => [
      { d: path([hip, ...legs[i]]), stroke: i ? '#c58a67' : '#a96e50', width: 14 },
      { d: path([hip, half(hip, legs[i][0])]), stroke: i ? '#243d53' : '#3c566b', width: 21 },
      { d: path([legs[i][1], toes[i]]), stroke: '#243d53', width: 11 },
    ]),
    { d: path([shoulder, [head[0], head[1] + 7]]), stroke: '#c58a67', width: 14 },
    { d: `${path([shoulder])} Q${n(bend[0])} ${n(bend[1])} ${n(hip[0])} ${n(hip[1])}`, stroke: '#0d7b78', width: 29 },
    ...([0, 1] as const).flatMap((i) => [
      { d: path([shoulder, ...arms[i]]), stroke: i ? '#d49a76' : '#b87e5b', width: 11 },
      { d: path([shoulder, half(shoulder, arms[i][0])]), stroke: i ? '#15938a' : '#0b6968', width: 17 },
      { d: dot(arms[i][1], 6), fill: i ? '#d49a76' : '#b87e5b' },
    ]),
    { d: dot(head, 14), fill: '#d49a76' },
    { d: `M${n(head[0] - 13)} ${n(head[1] - 2)}a13 13 0 0 1 26 -2l-7 -5 -10 3Z`, fill: '#243d53' },
  ];
}

/** A shared vector drawing keeps every reference sharp and available offline; SMIL animates it without JS per frame. */
function Figure({ pose, timeline }: { pose: ResolvedPose; timeline?: MotionTimeline }) {
  const frames = useMemo(() => timeline?.frames.map(shapes), [timeline]);
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="140" cy="224" rx="112" ry="5" fill="#dcebe9" />
      <path d="M16 220H264" stroke="#c5d9d6" strokeWidth="2" />
      {pose.wall && <path d="M51 25V220M43 25V220" stroke="#a6c7c2" strokeWidth="4" />}
      {shapes(pose).map((s, i) => (
        <path key={i} d={s.d} fill={s.fill ?? 'none'} stroke={s.stroke} strokeWidth={s.width}>
          {timeline && frames && (
            <animate
              attributeName="d"
              values={frames.map((f) => f[i].d).join(';')}
              keyTimes={timeline.keyTimes.map((t) => t.toFixed(4)).join(';')}
              dur={`${timeline.durationMs}ms`}
              repeatCount="indefinite"
            />
          )}
        </path>
      ))}
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
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const visual = EXERCISE_VISUALS[exercise.id];
  const timeline = useMemo(() => buildTimeline(visual), [visual]);

  if (compact) {
    return (
      <svg viewBox="0 0 280 240" aria-hidden="true" className={cn('rounded-xl bg-[#f0f7f6]', className)}>
        {reduceMotion ? (
          <Figure pose={resolvePose(visual.positions[1].pose)} />
        ) : (
          <Figure pose={timeline.frames[0]} timeline={timeline} />
        )}
      </svg>
    );
  }

  if (reduceMotion) return <StaticGuide exercise={exercise} className={className} />;
  // Keyed so switching exercise restarts the loop and the play state.
  return <AnimatedGuide key={exercise.id} exercise={exercise} timeline={timeline} className={className} />;
}

function AnimatedGuide({ exercise, timeline, className }: { exercise: Exercise; timeline: MotionTimeline; className?: string }) {
  const titleId = useId();
  const svg = useRef<SVGSVGElement>(null);
  const [playing, setPlaying] = useState(true);
  const [active, setActive] = useState(0);
  const { positions, cue } = EXERCISE_VISUALS[exercise.id];

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    if (!playing) {
      el.pauseAnimations();
      return;
    }
    el.unpauseAnimations();
    const id = setInterval(() => {
      const ms = (el.getCurrentTime() * 1000) % timeline.durationMs;
      setActive(positionAt(timeline, ms / timeline.durationMs));
    }, 100);
    return () => clearInterval(id);
  }, [playing, timeline]);

  return (
    <figure className={cn('w-full overflow-hidden rounded-2xl border border-border bg-[#f0f7f6] text-[#183b3a]', className)}>
      <figcaption className="flex items-center justify-between gap-2 px-4 pt-3 text-sm font-semibold">
        <span>Movement guide</span>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause movement animation' : 'Play movement animation'}
          className="-my-2 -mr-2 grid size-11 place-items-center rounded-full text-[#0d7b78] transition-colors hover:bg-[#dcebe9] focus-visible:outline-2 focus-visible:outline-[#0d7b78]"
        >
          {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
        </button>
      </figcaption>
      <svg ref={svg} viewBox="0 0 280 240" role="img" aria-labelledby={titleId} className="mx-auto block w-full max-w-72">
        <title id={titleId}>{exercise.name}: {positions.map((p) => p.label).join(', then ')}</title>
        <Figure pose={timeline.frames[0]} timeline={timeline} />
      </svg>
      <ol className="flex flex-wrap justify-center gap-2 px-3">
        {positions.map((position, i) => (
          <li
            key={position.label}
            aria-current={i === active ? 'step' : undefined}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold transition-colors',
              i === active ? 'bg-[#0d7b78] text-white' : 'bg-white/70',
            )}
          >
            <span
              className={cn('grid size-5 shrink-0 place-items-center rounded-full text-xs', i === active ? 'bg-white text-[#0d7b78]' : 'bg-[#0d7b78] text-white')}
              aria-hidden
            >
              {i + 1}
            </span>
            {position.label}
          </li>
        ))}
      </ol>
      <p className="min-h-10 px-4 pt-2 pb-3 text-center text-sm text-[#476562]">{positions[active].description}</p>
      <p className="border-t border-[#d1e3df] px-4 py-3 text-left text-sm leading-relaxed">{cue}</p>
    </figure>
  );
}

/** Shown when the device asks for reduced motion: every position side by side. */
function StaticGuide({ exercise, className }: { exercise: Exercise; className?: string }) {
  const titleId = useId();
  const visual = EXERCISE_VISUALS[exercise.id];
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
              <Figure pose={resolvePose(position.pose)} />
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
