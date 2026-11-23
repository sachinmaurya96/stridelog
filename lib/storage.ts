/** How much this site stores and how much the browser allows (null when unsupported). */
export async function estimateStorage() {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
}

export async function isStoragePersisted() {
  return (await navigator.storage?.persisted?.()) ?? false;
}

/** Asks the browser not to evict our data (photos!) under storage pressure. */
export async function requestPersistentStorage() {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}
