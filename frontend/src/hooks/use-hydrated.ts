"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Returns `true` once the component has mounted on the client.
 * Use to gate UI that depends on persisted (localStorage) state to
 * avoid Next.js hydration mismatch warnings.
 *
 * Implemented with useSyncExternalStore so React handles the
 * server/client divergence cleanly without an effect-driven setState.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
