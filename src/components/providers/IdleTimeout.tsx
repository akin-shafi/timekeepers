"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";

// Idle window in milliseconds. Kept in sync with NextAuth session.maxAge
// (15 minutes) in src/lib/auth.ts.
const IDLE_LIMIT_MS = 15 * 60 * 1000;
// Throttle activity handling so we don't reset the timer on every pixel of
// mouse movement — resetting at most once per second is plenty.
const ACTIVITY_THROTTLE_MS = 1000;

const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "click"] as const;

export function IdleTimeout() {
  const { status } = useSession();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const logout = useCallback(() => {
    signOut({ callbackUrl: "/auth/signin?reason=idle" });
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, IDLE_LIMIT_MS);
  }, [logout]);

  useEffect(() => {
    if (status !== "authenticated") {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current < ACTIVITY_THROTTLE_MS) return;
      lastActivityRef.current = now;
      resetTimer();
    };

    // Sync idle state across tabs: activity in one tab keeps the others alive,
    // and a logout in one tab tears down the others' timers.
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "idle:lastActivity") resetTimer();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // If the tab was hidden past the idle limit, log out immediately.
        if (Date.now() - lastActivityRef.current >= IDLE_LIMIT_MS) logout();
        else resetTimer();
      }
    };

    const broadcastActivity = () => {
      try {
        localStorage.setItem("idle:lastActivity", String(Date.now()));
      } catch {
        /* storage may be unavailable (private mode) — ignore */
      }
    };

    const onActivity = () => {
      handleActivity();
      broadcastActivity();
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);

    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, resetTimer, logout]);

  return null;
}
