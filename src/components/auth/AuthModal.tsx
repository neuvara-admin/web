"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { KeyboardEvent } from "react";
import { BrainLogo } from "@/components/ui/Logo";
import type { AuthUser } from "@/lib/auth";
import { LogInForm, SignUpForm } from "@/components/auth/AuthForms";

export type AuthView = "login" | "signup";

const copy: Record<AuthView, { heading: string; subheading: string }> = {
  signup: { heading: "Create your account", subheading: "Sign up to get started." },
  login: { heading: "Welcome back", subheading: "Log in to your account to continue." }
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type AuthModalProps = {
  view: AuthView | null;
  onViewChange: (view: AuthView) => void;
  onClose: () => void;
  onAuthenticated?: (user: AuthUser) => void;
};

export function AuthModal({ view, onViewChange, onClose, onAuthenticated }: AuthModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const descriptionId = useId();
  const isOpen = view !== null;

  useEffect(() => setIsMounted(true), []);

  // Entrance transition, scroll lock and Escape-to-close while open.
  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }

    const frame = requestAnimationFrame(() => setIsVisible(true));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  // Move focus to the first field whenever the modal opens or switches view.
  useEffect(() => {
    if (view) {
      panelRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    }
  }, [view]);

  if (!isMounted || !view) {
    return null;
  }

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !panelRef.current) {
      return;
    }

    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const handleAuthenticated = (user: AuthUser) => {
    onAuthenticated?.(user);
    onClose();
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[rgba(3,8,16,0.8)] p-4 backdrop-blur-sm transition-opacity duration-200 sm:p-6 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      data-testid="auth-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          // Stop the browser moving focus to <body>, so focus returns to the trigger.
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div
        aria-describedby={descriptionId}
        aria-labelledby={headingId}
        aria-modal="true"
        className={`relative my-auto w-full max-w-md rounded-3xl border border-[rgba(184,237,255,0.14)] bg-[rgba(9,20,36,0.98)] bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.55)] transition duration-200 sm:p-8 ${
          isVisible ? "translate-y-0 scale-100" : "translate-y-2 scale-[0.98]"
        }`}
        onKeyDown={trapFocus}
        ref={panelRef}
        role="dialog"
      >
        <button
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical-teal"
          onClick={onClose}
          type="button"
        >
          <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={2} viewBox="0 0 16 16">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        <div className="mb-6 pr-8">
          <BrainLogo size={30} />
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-white" id={headingId}>
            {copy[view].heading}
          </h2>
          <p className="mt-1.5 text-sm text-slate-300" id={descriptionId}>
            {copy[view].subheading}
          </p>
        </div>

        {view === "signup" ? (
          <SignUpForm
            key="signup"
            onAuthenticated={handleAuthenticated}
            onSwitch={() => onViewChange("login")}
          />
        ) : (
          <LogInForm
            key="login"
            onAuthenticated={handleAuthenticated}
            onSwitch={() => onViewChange("signup")}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
