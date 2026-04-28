"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    void navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (cancelled) return;
        console.log("Zyra service worker registered", registration.scope);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Zyra service worker registration failed:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
