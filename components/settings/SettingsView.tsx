'use client';

import { DataSection } from './DataSection';

export function SettingsView() {
  return (
    <div className="grid gap-4 py-2 lg:grid-cols-2">
      <DataSection />
    </div>
  );
}
