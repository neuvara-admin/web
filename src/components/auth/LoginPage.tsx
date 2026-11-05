"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogInForm } from "@/components/auth/AuthForms";
import { RequestAuditForm } from "@/components/auth/RequestAuditForm";
import { BrainLogo } from "@/components/ui/Logo";
import { endGuestSession } from "@/lib/guest";

type Mode = "login" | "request";

const REQUEST_HASH = "#request-audit";

const copy: Record<Mode, { heading: string; body: string }> = {
  login: {
    heading: "Welcome back",
    body: "Log in to access the platform."
  },
  request: {
    heading: "Request an audit",
    body: "Tell us about your model. Clients get a personalised dashboard with the audits of their own models."
  }
};

/** The current mode lives in the URL hash so refresh and Back/Forward work. */
function useMode(): [Mode, (mode: Mode) => void] {
  const [mode, setModeState] = useState<Mode>("login");

  useEffect(() => {
    const sync = () => setModeState(window.location.hash === REQUEST_HASH ? "request" : "login");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const setMode = (next: Mode) => {
    if (next === "request") {
      window.location.hash = REQUEST_HASH;
    } else {
      // Drop the hash without leaving a "#" behind.
      window.history.pushState(null, "", window.location.pathname + window.location.search);
      setModeState("login");
    }
  };

  return [mode, setMode];
}

/**
 * Dedicated Log In page for clients. Visitors who aren't clients yet can
 * request an audit from here instead of signing up.
 */
export function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useMode();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);

  // Move focus to the heading when switching, so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    headingRef.current?.focus();
  }, [mode]);

  const goBack = () => {
    const cameFromThisSite = document.referrer.startsWith(window.location.origin);

    if (cameFromThisSite && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-navy-950 text-slate-300">
      <header className="flex h-16 shrink-0 items-center px-5 sm:px-8">
        <button
          className="inline-flex items-center gap-1.5 rounded text-[13px] text-slate-400 transition-colors hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical-teal/70"
          onClick={goBack}
          type="button"
        >
          <svg aria-hidden className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 16 16">
            <path d="M12.5 8h-9M7.5 4l-4 4 4 4" />
          </svg>
          Back
        </button>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-24 pt-4">
        <div className="w-full max-w-[21rem]">
          <Link
            aria-label="Neuvara home"
            className="inline-flex rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical-teal/70"
            href="/"
          >
            <BrainLogo size={28} />
          </Link>
          <h1
            className="mt-10 text-[26px] font-medium leading-tight tracking-[-0.02em] text-slate-50 focus:outline-none"
            ref={headingRef}
            tabIndex={-1}
          >
            {copy[mode].heading}
          </h1>
          <p className="mt-2 text-[15px] leading-6 text-slate-400">{copy[mode].body}</p>

          <div className="mt-10">
            {mode === "login" ? (
              <LogInForm
                appearance="page"
                onAuthenticated={() => {
                  endGuestSession();
                  router.push("/dashboard/");
                }}
                onSwitch={() => setMode("request")}
                switchText={{ prompt: "Not a client yet?", action: "Request an audit" }}
              />
            ) : (
              <RequestAuditForm onBackToLogIn={() => setMode("login")} />
            )}
          </div>
        </div>
      </main>

      <footer className="flex h-16 shrink-0 items-center justify-center text-xs text-slate-600">
        <Link className="transition-colors hover:text-slate-400" href="/privacy/">
          Privacy
        </Link>
      </footer>
    </div>
  );
}
