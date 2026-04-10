"use client";

import { useEffect } from "react";

/**
 * Detects stale client-side bundles after a deployment and reloads the page.
 * Periodically fetches a lightweight endpoint; if the build ID changes,
 * it triggers a hard reload so users don't hit "Failed to find Server Action" errors.
 */
export function StaleDeploymentReloader() {
  useEffect(() => {
    let currentBuildId: string | null = null;

    async function check() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const remoteBuildId = data.buildId as string | undefined;
        if (!remoteBuildId) return;

        if (currentBuildId === null) {
          currentBuildId = remoteBuildId;
        } else if (currentBuildId !== remoteBuildId) {
          window.location.reload();
        }
      } catch {
        // Network error — ignore
      }
    }

    // Check every 5 minutes
    check();
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
