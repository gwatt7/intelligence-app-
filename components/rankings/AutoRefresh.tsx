"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps an open rankings page current: re-fetches the server-rendered
 * rankings when the tab regains focus and every 60 seconds while visible.
 * (Each page load already recalculates from the latest stats.)
 */
export function AutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(refresh, intervalMs);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, intervalMs]);

  return null;
}
