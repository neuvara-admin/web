"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthModal } from "@/components/auth/AuthModal";
import type { AuthView } from "@/components/auth/AuthModal";
import { AccountSettingsModal } from "@/components/account/AccountSettingsModal";
import { useDisplayProfile } from "@/lib/account-settings";
import { authClient, useAuthUser } from "@/lib/auth";
import { endGuestSession, startGuestSession, useIsGuest } from "@/lib/guest";

export type DashboardOptionId =
  | "guest"
  | "open-dashboard"
  | "login"
  | "signup"
  | "admin"
  | "exit-guest"
  | "settings"
  | "logout";

const DASHBOARD_PATH = "/dashboard/";

type DashboardOption = { id: DashboardOptionId; label: string };

const visitorOptions: DashboardOption[] = [
  { id: "guest", label: "Continue as Guest" },
  { id: "login", label: "Log in" },
  { id: "signup", label: "Sign up" },
  { id: "admin", label: "Admin" }
];

// Guests can upgrade to an account at any time, but never see Admin.
const guestAccountOptions: DashboardOption[] = [
  { id: "login", label: "Log in" },
  { id: "signup", label: "Sign up" },
  { id: "exit-guest", label: "Exit guest mode" }
];

const guestOptionsOnWebsite: DashboardOption[] = [
  { id: "open-dashboard", label: "Open dashboard" },
  ...guestAccountOptions
];

const signedInOptions: DashboardOption[] = [
  { id: "settings", label: "Account settings" },
  { id: "logout", label: "Log out" }
];

const signedInOptionsOnWebsite: DashboardOption[] = [
  { id: "open-dashboard", label: "Open dashboard" },
  ...signedInOptions
];

const optionsWithDividerBefore = new Set<DashboardOptionId>(["admin", "exit-guest", "logout"]);

type DashboardMenuProps = {
  onSelect?: (option: DashboardOptionId) => void;
  /** "site" for the marketing website header, "app" for the compact dashboard top bar. */
  appearance?: "site" | "app";
};

export function DashboardMenu({ onSelect, appearance = "site" }: DashboardMenuProps) {
  const isApp = appearance === "app";
  const [isOpen, setIsOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView | null>(null);
  const user = useAuthUser() ?? null;
  const profile = useDisplayProfile(user);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isGuestSession = useIsGuest();
  // A signed-in user is never treated as a guest.
  const isGuest = isGuestSession && !user;
  const router = useRouter();
  const isOnDashboard = usePathname()?.startsWith("/dashboard") ?? false;
  const options = user
    ? isOnDashboard
      ? signedInOptions
      : signedInOptionsOnWebsite
    : isGuest
      ? isOnDashboard
        ? guestAccountOptions
        : guestOptionsOnWebsite
      : visitorOptions;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    itemRefs.current[0]?.focus();

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (option: DashboardOptionId) => {
    setIsOpen(false);

    if (option === "login" || option === "signup") {
      setAuthView(option);
    } else if (option === "guest") {
      startGuestSession();
      router.push(DASHBOARD_PATH);
    } else if (option === "open-dashboard") {
      router.push(DASHBOARD_PATH);
    } else if (option === "settings") {
      setSettingsOpen(true);
    } else if (option === "logout") {
      signOut();
    } else if (option === "exit-guest") {
      endGuestSession();

      if (isOnDashboard) {
        router.push("/");
      } else {
        triggerRef.current?.focus();
      }
    } else {
      triggerRef.current?.focus();
    }

    onSelect?.(option);
  };

  function signOut() {
    setSettingsOpen(false);
    void authClient.logOut();

    if (isOnDashboard) {
      router.push("/login/");
    } else {
      triggerRef.current?.focus();
    }
  }

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    triggerRef.current?.focus();
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthView(null);
    triggerRef.current?.focus();
  }, []);

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = itemRefs.current.filter(
      (item): item is HTMLButtonElement => item !== null
    );
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    let next: number | null = null;

    if (event.key === "ArrowDown") next = (current + 1) % items.length;
    if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    if (event.key === "Tab") setIsOpen(false);

    if (next !== null) {
      event.preventDefault();
      items[next]?.focus();
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-controls={menuId}
        aria-label={
          isApp
            ? `Account menu${user ? `, signed in as ${profile.name}` : isGuest ? ", browsing as Guest" : ""}`
            : isGuest
              ? "Dashboard, browsing as Guest"
              : undefined
        }
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={
          isApp
            ? `inline-flex h-8 items-center gap-2 rounded-md border px-2 text-[13px] font-medium text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical-teal/70 ${
                isOpen
                  ? "border-white/[0.14] bg-white/[0.06]"
                  : "border-white/[0.09] hover:border-white/[0.14] hover:bg-white/[0.04]"
              }`
            : `inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold tracking-[-0.01em] text-white backdrop-blur transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical-teal focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${
                isOpen
                  ? "border-clinical-cyan/45 bg-white/[0.12]"
                  : "border-white/[0.18] bg-white/[0.07] hover:border-clinical-cyan/45 hover:bg-white/[0.12]"
              }`
        }
        onClick={() => setIsOpen((open) => !open)}
        ref={triggerRef}
        type="button"
      >
        {isApp ? (
          <>
            {user && profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- local data URL
              <img alt="" className="h-5 w-5 rounded-full object-cover" src={profile.avatar} />
            ) : (
              <span
                aria-hidden
                className={`flex h-5 w-5 items-center justify-center bg-white/[0.08] text-[11px] font-semibold text-slate-200 ${user ? "rounded-full" : "rounded"}`}
              >
                {user ? profile.initial : isGuest ? "G" : "?"}
              </span>
            )}
            <span className="max-w-[10rem] truncate">{user ? profile.name : isGuest ? "Guest" : "Account"}</span>
          </>
        ) : isGuest ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-clinical-teal/15 px-2 py-0.5 text-[0.7rem] font-semibold text-clinical-cyan">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-clinical-teal" />
            Guest
          </span>
        ) : null}
        {isApp ? null : (
          // Between md and lg the full nav is tight, so a guest sees just the Guest badge there.
          <span className={isGuest ? "md:max-lg:sr-only" : undefined}>Dashboard</span>
        )}
        <svg
          aria-hidden
          className={
            isApp
              ? "h-3 w-3 text-slate-500"
              : `h-3.5 w-3.5 text-slate-300 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`
          }
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 16 16"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      <div
        aria-label="Dashboard"
        className={
          isApp
            ? `absolute right-0 top-full z-50 mt-1.5 w-60 max-w-[calc(100vw-2rem)] rounded-lg border border-white/[0.1] bg-[#0c1828] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-opacity duration-100 ${
                isOpen ? "visible opacity-100" : "invisible opacity-0"
              }`
            : `absolute right-0 top-full z-50 mt-3 w-60 max-w-[calc(100vw-2.5rem)] origin-top-right rounded-2xl border border-white/10 bg-[rgba(7,17,31,0.96)] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition duration-200 ${
                isOpen
                  ? "visible translate-y-0 scale-100 opacity-100"
                  : "invisible -translate-y-1 scale-95 opacity-0"
              }`
        }
        id={menuId}
        onKeyDown={handleMenuKeyDown}
        role="menu"
      >
        {user ? (
          <div className={isApp ? "px-2.5 pb-1.5 pt-2" : "px-3.5 pb-2.5 pt-2"}>
            <p className="text-xs font-medium text-slate-400">Signed in as</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-white">{profile.name}</p>
            {profile.name !== user.email ? <p className="truncate text-xs text-slate-400">{user.email}</p> : null}
            <div aria-hidden className={isApp ? "-mx-2.5 mt-2.5 border-t border-white/[0.08]" : "mt-2.5 border-t border-white/10"} />
          </div>
        ) : null}
        {isGuest ? (
          <div className={isApp ? "px-2.5 pb-1.5 pt-2" : "px-3.5 pb-2.5 pt-2"}>
            <p className="text-xs font-medium text-slate-400">Browsing as</p>
            <p className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-white">
              <span aria-hidden className="h-2 w-2 rounded-full bg-clinical-teal" />
              Guest
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              No account needed. Log in or sign up any time.
            </p>
            <div aria-hidden className={isApp ? "-mx-2.5 mt-2.5 border-t border-white/[0.08]" : "mt-2.5 border-t border-white/10"} />
          </div>
        ) : null}
        {options.map((option, index) => (
          <div key={option.id}>
            {optionsWithDividerBefore.has(option.id) && index > 0 && (
              <div
                aria-hidden
                className={isApp ? "-mx-1 my-1 border-t border-white/[0.08]" : "mx-2 my-1.5 border-t border-white/10"}
              />
            )}
            <button
              className={
                isApp
                  ? "flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-[13px] text-slate-300 hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:bg-white/[0.06] focus-visible:text-white"
                  : "flex w-full items-center rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-slate-300 transition duration-200 hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:bg-white/[0.08] focus-visible:text-white"
              }
              onClick={() => handleSelect(option.id)}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              role="menuitem"
              tabIndex={isOpen ? 0 : -1}
              type="button"
            >
              {option.label}
            </button>
          </div>
        ))}
      </div>

      {user ? (
        <AccountSettingsModal onClose={closeSettings} onSignOut={signOut} open={settingsOpen} user={user} />
      ) : null}

      <AuthModal
        onAuthenticated={endGuestSession}
        onClose={closeAuthModal}
        onViewChange={setAuthView}
        view={authView}
      />
    </div>
  );
}
