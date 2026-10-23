import { useSyncExternalStore } from "react";

import { isValidTimezone } from "@/lib/user-preferences";

const subscribe = () => () => {};

function getSnapshot(): string | null {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return zone && isValidTimezone(zone) ? zone : null;
}

/** The browser's timezone. It is null on the server and during hydration. */
export function useDetectedTimezone(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
