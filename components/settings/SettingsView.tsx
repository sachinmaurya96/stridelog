'use client';

import { DataSection } from './DataSection';
import { GoalsSection } from './GoalsSection';
import { InstallSection } from './InstallSection';
import { PreferencesSection } from './PreferencesSection';
import { ProfileSection } from './ProfileSection';
import { StorageSection } from './StorageSection';

export function SettingsView() {
  return (
    <div className="grid items-start gap-4 py-2 lg:grid-cols-2">
      <ProfileSection />
      <GoalsSection />
      <PreferencesSection />
      <DataSection />
      <StorageSection />
      <InstallSection />
    </div>
  );
}
