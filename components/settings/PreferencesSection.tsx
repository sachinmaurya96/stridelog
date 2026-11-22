'use client';

import { Monitor, Moon, SlidersHorizontal, Sun } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Segmented } from '@/components/common/Segmented';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useSettingsStore } from '@/store/settingsStore';

export function PreferencesSection() {
  const units = useSettingsStore((s) => s.units);
  const update = useSettingsStore((s) => s.update);
  const { theme, setTheme } = useAppTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-run-ink" aria-hidden />
          Preferences
        </CardTitle>
        <CardDescription>Units are applied everywhere in the app.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span id="units-label" className="text-sm font-medium">
            Distance units
          </span>
          <Segmented
            label="Distance units"
            value={units}
            onChange={(u) => update({ units: u })}
            options={[
              { value: 'km', label: 'Kilometres' },
              { value: 'mi', label: 'Miles' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Theme</span>
          <Segmented
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'dark', label: 'Dark', icon: <Moon className="size-4" aria-hidden /> },
              { value: 'light', label: 'Light', icon: <Sun className="size-4" aria-hidden /> },
              { value: 'system', label: 'System', icon: <Monitor className="size-4" aria-hidden /> },
            ]}
          />
        </div>
      </CardContent>
    </Card>
  );
}
