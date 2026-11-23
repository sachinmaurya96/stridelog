// The tracker reads time from here instead of Date.now() so the GPS simulator can
// fast-forward a session (e.g. 20× speed) while all timing math stays consistent.

let scale = 1;
let baseVirtual = 0;
let baseReal = 0;

export function now() {
  return scale === 1 ? Date.now() : baseVirtual + (Date.now() - baseReal) * scale;
}

/** Only change the scale while no tracking span is running. Setting 1 returns to real time. */
export function setTimeScale(k: number) {
  if (k === 1) {
    scale = 1;
    return;
  }
  baseVirtual = now();
  baseReal = Date.now();
  scale = k;
}

export const timeScale = () => scale;
