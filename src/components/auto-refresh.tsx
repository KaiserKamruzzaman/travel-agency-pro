"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const DEFAULT_INTERVAL_MS = 30_000;

// Requirements 5.3: an auto-refreshing summary view is sufficient for v1 —
// no need for a socket-based live dashboard. Re-running the server
// component via router.refresh() keeps this a plain server-rendered page.
export function AutoRefresh({ intervalMs = DEFAULT_INTERVAL_MS }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
