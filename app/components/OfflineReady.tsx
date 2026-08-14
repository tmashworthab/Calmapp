"use client";

import { useEffect } from "react";

/**
 * Registers the service worker so the app opens with no connection at all —
 * which is exactly the situation it is likeliest to be needed in.
 *
 * Dev is skipped: a cached shell makes hot reload lie about what's on screen.
 */
export function OfflineReady() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is a bonus; the app works without it.
    });
  }, []);

  return null;
}
