'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Plus, X } from 'lucide-react';
import type { DailyNote, Rating } from '@/data/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { checkBadges } from '@/data/badgeService';
import { noteRepo } from '@/data/repositories';
import { cn } from '@/lib/utils';
import { MoodPicker } from './MoodPicker';

export const QUICK_TAGS = ['sore', 'great-sleep', 'tired', 'pr'];
const ENERGY = ['Drained', 'Low', 'Okay', 'Good', 'Charged'];

const normalizeTag = (t: string) =>
  t
    .trim()
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .slice(0, 24);

type Draft = Pick<DailyNote, 'mood' | 'energy' | 'text' | 'tags'>;

/** Edits the note for one date and auto-saves 800 ms after the last change. */
export function NoteEditor({ date, initial }: { date: string; initial: DailyNote | null }) {
  const [draft, setDraft] = useState<Draft>(() => ({
    mood: initial?.mood ?? 3,
    energy: initial?.energy ?? 3,
    text: initial?.text ?? '',
    tags: initial?.tags ?? [],
  }));
  const [status, setStatus] = useState<'idle' | 'pending' | 'saved'>(initial ? 'saved' : 'idle');
  const [customTag, setCustomTag] = useState('');
  const pending = useRef<Draft | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNew = useRef(!initial);

  const flush = async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const d = pending.current;
    if (!d) return;
    pending.current = null;
    await noteRepo.save({ date, ...d, updatedAt: Date.now() });
    setStatus('saved');
    if (isNew.current) {
      isNew.current = false;
      await checkBadges();
    }
  };
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });
  // Save whatever is pending when leaving the page or switching dates.
  useEffect(() => () => void flushRef.current(), []);

  const update = (patch: Partial<Draft>) => {
    setDraft((d) => {
      const next = { ...d, ...patch };
      pending.current = next;
      return next;
    });
    setStatus('pending');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flushRef.current(), 800);
  };

  const toggleTag = (tag: string) =>
    update({ tags: draft.tags.includes(tag) ? draft.tags.filter((t) => t !== tag) : [...draft.tags, tag] });

  const addCustom = () => {
    const t = normalizeTag(customTag);
    if (t && !draft.tags.includes(t)) update({ tags: [...draft.tags, t] });
    setCustomTag('');
  };

  const customTags = draft.tags.filter((t) => !QUICK_TAGS.includes(t));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">How do you feel?</span>
        <MoodPicker value={draft.mood} onChange={(mood) => update({ mood })} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <Label id="energy-label">Energy</Label>
          <span className="text-sm text-muted-foreground">
            {draft.energy} / 5 · {ENERGY[draft.energy - 1]}
          </span>
        </div>
        <Slider
          aria-labelledby="energy-label"
          min={1}
          max={5}
          step={1}
          value={[draft.energy]}
          onValueChange={([v]) => update({ energy: v as Rating })}
          className="py-2"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="note-text">Notes</Label>
        <Textarea
          id="note-text"
          rows={5}
          value={draft.text}
          maxLength={2000}
          placeholder="How did training go? How did you sleep?"
          onChange={(e) => update({ text: e.target.value })}
          className="min-h-32 resize-y text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Tags</span>
        <div className="flex flex-wrap gap-2">
          {QUICK_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={draft.tags.includes(t)}
              onClick={() => toggleTag(t)}
              className={cn(
                'h-10 rounded-full border border-border px-4 text-sm transition-colors',
                draft.tags.includes(t) ? 'border-transparent bg-foreground text-background' : 'hover:bg-muted',
              )}
            >
              #{t}
            </button>
          ))}
          {customTags.map((t) => (
            <span key={t} className="flex h-10 items-center gap-1 rounded-full bg-foreground pr-1 pl-4 text-sm text-background">
              #{t}
              <button
                type="button"
                onClick={() => toggleTag(t)}
                aria-label={`Remove tag ${t}`}
                className="grid size-8 place-items-center rounded-full hover:bg-background/20"
              >
                <X className="size-4" aria-hidden />
              </button>
            </span>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addCustom();
          }}
        >
          <Label htmlFor="custom-tag" className="sr-only">
            Custom tag
          </Label>
          <Input id="custom-tag" value={customTag} onChange={(e) => setCustomTag(e.target.value)} placeholder="Add your own tag" maxLength={24} />
          <Button type="submit" variant="outline" disabled={!normalizeTag(customTag)}>
            <Plus aria-hidden /> Add
          </Button>
        </form>
      </div>

      <p className="flex h-5 items-center gap-1.5 text-sm text-muted-foreground" role="status" aria-live="polite">
        {status === 'pending' && (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden /> Saving…
          </>
        )}
        {status === 'saved' && (
          <>
            <Check className="size-4 text-emerald-500" aria-hidden /> Saved
          </>
        )}
        {status === 'idle' && 'Changes save automatically.'}
      </p>
    </div>
  );
}
