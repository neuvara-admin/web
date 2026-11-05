"use client";

/**
 * Account settings that can work today without a backend. They are saved in
 * this browser (localStorage), per user. Settings that need an account
 * service (email change, password, two-factor, deletion, …) are not stored
 * here; the settings modal marks those as "Not connected".
 */

import { useSyncExternalStore } from "react";
import type { AuthUser } from "@/lib/auth";

export type StartPage = "overview" | "audits" | "reports";
export type ThemePreference = "dark" | "light" | "system";

export type AccountSettings = {
  profile: {
    /** Display name override. Empty means "use the account name". */
    name: string;
    /** Small profile picture as a data URL, or null. */
    avatar: string | null;
  };
  notifications: {
    auditUpdates: boolean;
    reportAvailable: boolean;
    productNews: boolean;
  };
  theme: ThemePreference;
  startPage: StartPage;
  privacy: {
    visibleToOrganisation: boolean;
  };
};

export const defaultAccountSettings: AccountSettings = {
  profile: { name: "", avatar: null },
  notifications: { auditUpdates: true, reportAvailable: true, productNews: false },
  theme: "dark",
  startPage: "overview",
  privacy: { visibleToOrganisation: true }
};

const CHANGE_EVENT = "neuvara:settings-change";
const storageKey = (userId: string) => `neuvara:settings:${userId}`;

function merge(saved: Partial<AccountSettings> | null): AccountSettings {
  return {
    profile: { ...defaultAccountSettings.profile, ...saved?.profile },
    notifications: { ...defaultAccountSettings.notifications, ...saved?.notifications },
    theme: saved?.theme ?? defaultAccountSettings.theme,
    startPage: saved?.startPage ?? defaultAccountSettings.startPage,
    privacy: { ...defaultAccountSettings.privacy, ...saved?.privacy }
  };
}

// useSyncExternalStore needs the same object back while the stored text is unchanged.
const cache = new Map<string, { raw: string | null; value: AccountSettings }>();

function readSettings(userId: string): AccountSettings {
  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(storageKey(userId));
  } catch {
    raw = null;
  }

  const cached = cache.get(userId);

  if (cached && cached.raw === raw) {
    return cached.value;
  }

  let parsed: Partial<AccountSettings> | null = null;

  try {
    parsed = raw ? (JSON.parse(raw) as Partial<AccountSettings>) : null;
  } catch {
    parsed = null;
  }

  const value = merge(parsed);
  cache.set(userId, { raw, value });
  return value;
}

export function saveAccountSettings(userId: string, settings: AccountSettings) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(settings));
  } catch {
    throw new Error("Couldn't save settings in this browser. Storage may be full or disabled.");
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearAccountSettings(userId: string) {
  try {
    window.localStorage.removeItem(storageKey(userId));
  } catch {
    // Nothing to clear.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Saved settings for a user (defaults during server rendering or when signed out). */
export function useAccountSettings(userId: string | null | undefined): AccountSettings {
  return useSyncExternalStore(
    subscribe,
    () => (userId ? readSettings(userId) : defaultAccountSettings),
    () => defaultAccountSettings
  );
}

/** The name and picture to show for a user, after their profile edits. */
export function useDisplayProfile(user: AuthUser | null | undefined) {
  const settings = useAccountSettings(user?.id);
  const name = settings.profile.name.trim() || user?.name || user?.email || "";

  return { name, avatar: settings.profile.avatar, initial: name.charAt(0).toUpperCase() || "?" };
}

/** Reads a chosen image and returns a small square JPEG data URL for the profile picture. */
export function resizeProfilePicture(file: File, size = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Choose an image file (JPG, PNG or WebP)."));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("Choose an image smaller than 5 MB."));
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("Couldn't process that image."));
        return;
      }

      // Centre-crop to a square.
      const side = Math.min(image.width, image.height);
      context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image."));
    };

    image.src = url;
  });
}
