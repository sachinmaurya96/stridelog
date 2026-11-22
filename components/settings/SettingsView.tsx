'use client';

import { DataSection } from './DataSection';
import { GoalsSection } from './GoalsSection';
import { PreferencesSection } from './PreferencesSection';
import { ProfileSection } from './ProfileSection';

export function SettingsView() {
  return (
    <div className="grid items-start gap-4 py-2 lg:grid-cols-2">
      <ProfileSection />
      <GoalsSection />
      <PreferencesSection />
      <DataSection />
    </div>
  );
}
