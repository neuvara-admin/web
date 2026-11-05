"use client";

import { useSyncExternalStore } from "react";

/**
 * Guest browsing session.
 *
 * Lets visitors use the site as a "Guest" without registering. Nothing is
 * created on a server: the flag lives in sessionStorage, so it survives
 * refreshes and moving between pages in the same tab, and disappears when the
 * tab is closed. It is completely independent of authentication.
 *
 * Guests must never be treated as authenticated users and must not be given
 * access to administrator functionality.
 */

const STORAGE_KEY = "neuvara:guest-session";
const CHANGE_EVENT = "neuvara:guest-session-change";

function readGuestSession() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Storage can be unavailable (e.g. some private browsing modes).
    return false;
  }
}

function writeGuestSession(isGuest: boolean) {
  try {
    if (isGuest) {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Without storage the guest session just won't survive a refresh.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function startGuestSession() {
  writeGuestSession(true);
}

export function endGuestSession() {
  writeGuestSession(false);
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** True while the visitor is browsing as a guest. Always false during server rendering. */
export function useIsGuest() {
  return useSyncExternalStore(subscribe, readGuestSession, () => false);
}

/**
 * Like useIsGuest, but returns "unknown" until the browser has been checked,
 * so pages that are only for guests don't flash their sign-in screen on load.
 */
export function useGuestStatus(): "unknown" | "guest" | "visitor" {
  return useSyncExternalStore(
    subscribe,
    () => (readGuestSession() ? "guest" : "visitor"),
    () => "unknown"
  );
}
