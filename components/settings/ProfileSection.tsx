'use client';

import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberStepper } from '@/components/common/NumberStepper';
import { Segmented } from '@/components/common/Segmented';
import { useSettingsStore } from '@/store/settingsStore';
import { LIMITS, NAME_MAX } from './fields';

export function ProfileSection() {
  const { name, weightKg, heightCm, age, sex, update } = useSettingsStore();
  const [draftName, setDraftName] = useState(name);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-4 text-run-ink" aria-hidden />
          Profile
        </CardTitle>
        <CardDescription>Used for your greeting and for calorie, step, water and sleep targets.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="settings-name">Name</Label>
          <Input
            id="settings-name"
            autoComplete="given-name"
            maxLength={NAME_MAX}
            value={draftName}
            onChange={(e) => {
              setDraftName(e.target.value);
              if (e.target.value.trim()) update({ name: e.target.value.trim() });
            }}
            onBlur={() => setDraftName(name)}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberStepper id="settings-weight" label="Weight" unit="kg" value={weightKg} onChange={(v) => update({ weightKg: v })} {...LIMITS.weightKg} />
          <NumberStepper id="settings-height" label="Height" unit="cm" value={heightCm} onChange={(v) => update({ heightCm: v })} {...LIMITS.heightCm} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberStepper id="settings-age" label="Age" unit="years" value={age} onChange={(v) => update({ age: v })} {...LIMITS.age} />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Sex (for calorie estimates)</span>
            <Segmented
              label="Sex"
              value={sex}
              onChange={(v) => update({ sex: v })}
              options={[
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
                { value: 'unspecified', label: 'Other' },
              ]}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
