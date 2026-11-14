"use client";

import { useEffect, useState } from "react";

/**
 * Current time in ms, read on the client only (null during SSR / before hydration)
 * so cached pages never render a stale "now". Refreshes every `intervalMs`.
 */
export function useNow(intervalMs = 60_000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
