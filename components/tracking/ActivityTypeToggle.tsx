'use client';

import type { ActivityType } from '@/data/types';
import { Segmented } from '@/components/common/Segmented';
import { ACTIVITY_META } from '@/components/common/activity';

export function ActivityTypeToggle({
  value,
  onChange,
  disabled,
}: {
  value: ActivityType;
  onChange: (t: ActivityType) => void;
  disabled?: boolean;
}) {
  return (
    <Segmented
      label="Activity type"
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="h-12"
      options={(['run', 'walk'] as const).map((t) => {
        const m = ACTIVITY_META[t];
        return {
          value: t,
          label: m.label,
          icon: <m.Icon className="size-4" aria-hidden />,
          activeClassName: `${m.gradient} data-[state=on]:text-ink-on-accent font-semibold`,
        };
      })}
    />
  );
}
