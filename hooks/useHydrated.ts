import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * `false` on the server and during hydration, `true` after the client has mounted.
 * Use it to render skeletons until localStorage / IndexedDB data can be read,
 * so persisted values never cause a hydration mismatch.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
