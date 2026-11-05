"use client";

/**
 * Authentication client used by the Log in / Sign up forms.
 *
 * No authentication backend is configured for this site yet (it is a static
 * export with no API routes), so sign-up, log-in and password reset reject
 * with an `AuthError` of code "not_configured".
 *
 * TEST LOGIN (development only): while running `npm run dev`, logging in with
 * email "test" and password "test" signs you in as a local test user so the
 * signed-in dashboard can be previewed. It is disabled in production builds,
 * creates no account anywhere, and is kept in sessionStorage (cleared when the
 * tab closes). Remove it when real authentication is connected.
 *
 * To connect a real provider, implement `AuthClient` and assign it to
 * `authClient` below. Remember to allow the provider's origin in
 * `connect-src` in next.config.mjs.
 */

import { useSyncExternalStore } from "react";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
};

export type LogInInput = {
  email: string;
  password: string;
};

export type AuthErrorCode =
  | "not_configured"
  | "invalid_credentials"
  | "email_in_use"
  | "network"
  | "unknown";

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

export interface AuthClient {
  signUp(input: SignUpInput): Promise<AuthUser>;
  logIn(input: LogInInput): Promise<AuthUser>;
  logOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
}

/* ───────────────────────── Test login (development only) ───────────────────────── */

const TEST_LOGIN_ENABLED = process.env.NODE_ENV === "development";
const TEST_CREDENTIALS = { email: "test", password: "test" };
const TEST_USER: AuthUser = { id: "test-user", email: "test", name: "Test user" };

const SESSION_KEY = "neuvara:test-session";
const SESSION_EVENT = "neuvara:auth-change";

/** True when `email` is the development test login, which skips email-format validation. */
export function isTestLoginEmail(email: string) {
  return TEST_LOGIN_ENABLED && email === TEST_CREDENTIALS.email;
}

function readSessionUser(): AuthUser | null {
  if (!TEST_LOGIN_ENABLED) {
    return null;
  }

  try {
    return window.sessionStorage.getItem(SESSION_KEY) === TEST_USER.id ? TEST_USER : null;
  } catch {
    return null;
  }
}

function writeSessionUser(user: AuthUser | null) {
  try {
    if (user) {
      window.sessionStorage.setItem(SESSION_KEY, user.id);
    } else {
      window.sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Without storage the session just won't survive a refresh.
  }

  window.dispatchEvent(new Event(SESSION_EVENT));
}

function subscribeToSession(onChange: () => void) {
  window.addEventListener(SESSION_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(SESSION_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * The signed-in user, or null when signed out. Returns undefined during
 * server rendering and the first client render, before the session is known.
 */
export function useAuthUser(): AuthUser | null | undefined {
  return useSyncExternalStore(subscribeToSession, readSessionUser, () => undefined);
}

/* ───────────────────────── Client ───────────────────────── */

const notConfigured = (action: string) =>
  new AuthError("not_configured", `${action} isn't available yet. Authentication hasn't been set up for this site.`);

const defaultClient: AuthClient = {
  async signUp() {
    throw notConfigured("Account sign-up");
  },
  async logIn({ email, password }) {
    if (isTestLoginEmail(email)) {
      if (password !== TEST_CREDENTIALS.password) {
        throw new AuthError("invalid_credentials", "Incorrect email address or password.");
      }

      writeSessionUser(TEST_USER);
      return TEST_USER;
    }

    throw notConfigured("Log in");
  },
  async logOut() {
    writeSessionUser(null);
  },
  async requestPasswordReset() {
    throw notConfigured("Password reset");
  }
};

export const authClient: AuthClient = defaultClient;

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof AuthError) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
