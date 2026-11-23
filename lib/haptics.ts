/** Vibrates on devices that support it; silently does nothing elsewhere (e.g. iOS Safari). */
export function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}
