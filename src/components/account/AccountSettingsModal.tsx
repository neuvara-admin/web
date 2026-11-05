"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { buttonPrimary, buttonSecondary } from "@/components/dashboard/ui";
import type { AuthUser } from "@/lib/auth";
import {
  clearAccountSettings,
  defaultAccountSettings,
  resizeProfilePicture,
  saveAccountSettings,
  useAccountSettings
} from "@/lib/account-settings";
import type { AccountSettings, StartPage, ThemePreference } from "@/lib/account-settings";

/* ───────────────────────── Sections ───────────────────────── */

const sections = [
  { id: "profile", label: "Profile", description: "How you appear in Neuvara." },
  { id: "security", label: "Security", description: "Password, sign-in and two-factor authentication." },
  { id: "preferences", label: "Preferences", description: "Notifications, appearance and app behaviour." },
  { id: "privacy", label: "Privacy", description: "Your personal data and who can see your account." },
  { id: "account", label: "Account", description: "Sign out or delete your account." }
] as const;

type SectionId = (typeof sections)[number]["id"];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* ───────────────────────── Small building blocks ───────────────────────── */

/** Marks a setting that needs the (not yet built) account service. */
function NotConnected() {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded border border-white/[0.1] px-1.5 text-[10px] font-medium uppercase leading-4 tracking-[0.04em] text-slate-500"
      title="Needs the account service, which isn't set up yet."
    >
      Not connected
    </span>
  );
}

function Row({
  title,
  description,
  tag,
  children
}: {
  title: string;
  description?: ReactNode;
  tag?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:gap-8">
      <div>
        <p className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-slate-200">
          {title}
          {tag}
        </p>
        {description ? <p className="mt-1 text-[13px] leading-5 text-slate-500">{description}</p> : null}
      </div>
      <div className="min-w-0 sm:pt-0.5">{children}</div>
    </div>
  );
}

const inputClass =
  "h-9 w-full rounded-md border-0 bg-white/[0.04] px-3 text-sm text-slate-100 outline-none ring-1 ring-inset ring-transparent transition-colors placeholder:text-slate-600 hover:bg-white/[0.055] focus:bg-white/[0.06] focus:ring-white/25 disabled:cursor-not-allowed disabled:text-slate-500 disabled:hover:bg-white/[0.04]";

function Switch({
  checked,
  disabled,
  label,
  onChange
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "bg-clinical-teal" : "bg-white/[0.12]"
      }`}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      role="switch"
      type="button"
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`}
      />
    </button>
  );
}

function RadioList<T extends string>({
  name,
  options,
  value,
  onChange
}: {
  name: string;
  options: { value: T; label: string; disabled?: boolean; note?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2" role="radiogroup">
      {options.map((option) => (
        <label
          className={`flex items-center gap-2.5 text-[13px] ${option.disabled ? "cursor-not-allowed text-slate-500" : "cursor-pointer text-slate-200"}`}
          key={option.value}
        >
          <input
            checked={value === option.value}
            className="peer sr-only"
            disabled={option.disabled}
            name={name}
            onChange={() => onChange(option.value)}
            type="radio"
            value={option.value}
          />
          <span
            aria-hidden
            className={`flex h-4 w-4 items-center justify-center rounded-full ring-1 ring-inset peer-focus-visible:ring-2 peer-focus-visible:ring-white/40 ${
              value === option.value ? "ring-clinical-teal" : "ring-white/20"
            }`}
          >
            {value === option.value ? <span className="h-2 w-2 rounded-full bg-clinical-teal" /> : null}
          </span>
          {option.label}
          {option.note}
        </label>
      ))}
    </div>
  );
}

function SectionFooter({
  dirty,
  onCancel,
  onSave,
  status
}: {
  dirty: boolean;
  onCancel: () => void;
  onSave: () => void;
  status: string | null;
}) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-2 flex items-center justify-end gap-2 border-t border-white/[0.07] bg-[#0c1828] px-5 py-3 sm:-mx-8 sm:px-8">
      <p aria-live="polite" className="mr-auto text-xs text-slate-500">
        {status ?? (dirty ? "You have unsaved changes." : "Saved in this browser.")}
      </p>
      <button className={`${buttonSecondary} h-8 px-3 text-[13px]`} disabled={!dirty} onClick={onCancel} type="button">
        Cancel
      </button>
      <button className={`${buttonPrimary} h-8 px-3 text-[13px] disabled:opacity-40`} disabled={!dirty} onClick={onSave} type="button">
        Save changes
      </button>
    </div>
  );
}

/** A small confirmation dialog shown on top of the settings modal. */
function ConfirmDialog({
  title,
  children,
  onCancel,
  actions
}: {
  title: string;
  children: ReactNode;
  onCancel: () => void;
  actions: ReactNode;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("input, button")?.focus();
  }, []);

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(3,8,16,0.7)] p-4"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onCancel();
        }
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-sm rounded-lg border border-white/[0.1] bg-[#0f1c2e] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
        ref={ref}
        role="alertdialog"
      >
        <h3 className="text-[15px] font-semibold text-slate-50" id={titleId}>
          {title}
        </h3>
        <div className="mt-2 text-[13px] leading-5 text-slate-400">{children}</div>
        <div className="mt-5 flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
}

/* ───────────────────────── Modal ───────────────────────── */

type AccountSettingsModalProps = {
  user: AuthUser;
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
};

export function AccountSettingsModal({ user, open, onClose, onSignOut }: AccountSettingsModalProps) {
  const saved = useAccountSettings(user.id);
  const [draft, setDraft] = useState<AccountSettings>(saved);
  const [section, setSection] = useState<SectionId>("profile");
  const [status, setStatus] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | "discard" | "delete" | "clear">(null);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  useEffect(() => setMounted(true), []);

  // Start from the saved settings each time the modal opens.
  useEffect(() => {
    if (open) {
      setDraft(saved);
      setStatus(null);
      setConfirm(null);
      setSection("profile");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when opening
  }, [open]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const requestClose = useCallback(() => {
    if (JSON.stringify(draft) !== JSON.stringify(saved)) {
      setConfirm("discard");
    } else {
      onClose();
    }
  }, [draft, saved, onClose]);

  // Scroll lock + Escape.
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!mounted || !open) return null;

  const update = (patch: (current: AccountSettings) => AccountSettings) => {
    setStatus(null);
    setDraft(patch);
  };

  const save = () => {
    try {
      saveAccountSettings(user.id, draft);
      setStatus("Changes saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Couldn't save changes.");
    }
  };

  const cancel = () => {
    setDraft(saved);
    setStatus("Changes discarded.");
  };

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && !confirm) {
      event.preventDefault();
      requestClose();
      return;
    }

    if (event.key !== "Tab" || !panelRef.current) return;

    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (element) => element.offsetParent !== null
    );
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

  const active = sections.find((item) => item.id === section) ?? sections[0];
  const footer = <SectionFooter dirty={isDirty} onCancel={cancel} onSave={save} status={status} />;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-stretch justify-center bg-[rgba(3,8,16,0.72)] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault();
          requestClose();
        }
      }}
    >
      <div
        aria-labelledby={headingId}
        aria-modal="true"
        className="relative flex h-full w-full flex-col overflow-hidden bg-[#0c1828] text-slate-300 sm:h-[min(40rem,calc(100vh-3rem))] sm:max-w-3xl sm:rounded-xl sm:border sm:border-white/[0.08] sm:shadow-[0_24px_64px_rgba(0,0,0,0.45)] md:flex-row"
        onKeyDown={trapFocus}
        ref={panelRef}
        role="dialog"
      >
        {/* Navigation */}
        <nav aria-label="Settings sections" className="shrink-0 border-b border-white/[0.07] md:flex md:w-52 md:flex-col md:border-b-0 md:border-r md:bg-white/[0.015]">
          <div className="flex items-center justify-between px-5 pb-1 pt-5 md:pb-3">
            <h2 className="text-[15px] font-semibold text-slate-50" id={headingId}>
              Settings
            </h2>
            <button
              aria-label="Close settings"
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 md:hidden"
              onClick={requestClose}
              type="button"
            >
              <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={1.6} viewBox="0 0 16 16">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
          <ul className="flex gap-1 overflow-x-auto px-3 pb-2 md:flex-col md:gap-px md:pb-0">
            {sections.map((item) => (
              <li className="shrink-0" key={item.id}>
                <button
                  aria-current={section === item.id ? "page" : undefined}
                  className={`flex h-8 w-full items-center rounded-md px-2.5 text-left text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                    section === item.id
                      ? "bg-white/[0.07] font-medium text-slate-100"
                      : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                  }`}
                  data-autofocus={item.id === "profile" ? "" : undefined}
                  onClick={() => {
                    setSection(item.id);
                    setStatus(null);
                  }}
                  type="button"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-auto hidden px-5 pb-5 pt-8 text-[11px] leading-4 text-slate-500 md:block">
            Settings marked <span className="whitespace-nowrap font-medium text-slate-400">Not connected</span> need the
            account service, which isn&apos;t set up yet. Everything else is saved in this browser.
          </p>
        </nav>

        {/* Content */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="hidden items-start justify-between gap-4 px-8 pt-6 md:flex">
            <div>
              <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-slate-50">{active.label}</h3>
              <p className="mt-0.5 text-[13px] text-slate-500">{active.description}</p>
            </div>
            <button
              aria-label="Close settings"
              className="-mr-2 -mt-1 flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              onClick={requestClose}
              type="button"
            >
              <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={1.6} viewBox="0 0 16 16">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2 sm:px-8">
            <div className="divide-y divide-white/[0.06]">
              {section === "profile" && <ProfileSection draft={draft} update={update} user={user} />}
              {section === "security" && <SecuritySection user={user} />}
              {section === "preferences" && <PreferencesSection draft={draft} update={update} />}
              {section === "privacy" && (
                <PrivacySection onClearRequest={() => setConfirm("clear")} saved={saved} user={user} />
              )}
              {section === "account" && (
                <AccountSection onDeleteRequest={() => setConfirm("delete")} onSignOut={onSignOut} />
              )}
            </div>
            {section === "profile" || section === "preferences" ? footer : <div className="h-6" />}
          </div>
        </div>

        {/* Confirmation prompts */}
        {confirm === "discard" ? (
          <ConfirmDialog
            actions={
              <>
                <button className={`${buttonSecondary} h-8 px-3 text-[13px]`} onClick={() => setConfirm(null)} type="button">
                  Keep editing
                </button>
                <button
                  className={`${buttonPrimary} h-8 px-3 text-[13px]`}
                  onClick={() => {
                    setConfirm(null);
                    onClose();
                  }}
                  type="button"
                >
                  Discard changes
                </button>
              </>
            }
            onCancel={() => setConfirm(null)}
            title="Discard unsaved changes?"
          >
            You&apos;ve made changes that haven&apos;t been saved. If you close settings now, they&apos;ll be lost.
          </ConfirmDialog>
        ) : null}

        {confirm === "clear" ? (
          <ConfirmDialog
            actions={
              <>
                <button className={`${buttonSecondary} h-8 px-3 text-[13px]`} onClick={() => setConfirm(null)} type="button">
                  Cancel
                </button>
                <button
                  className="inline-flex h-8 items-center rounded-md bg-rose-500/90 px-3 text-[13px] font-medium text-white transition-colors hover:bg-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60"
                  onClick={() => {
                    clearAccountSettings(user.id);
                    setDraft(defaultAccountSettings);
                    setConfirm(null);
                    setStatus(null);
                  }}
                  type="button"
                >
                  Clear data
                </button>
              </>
            }
            onCancel={() => setConfirm(null)}
            title="Clear data saved in this browser?"
          >
            This removes your profile picture, display name and preferences from this browser and restores the
            defaults. Your account itself isn&apos;t affected.
          </ConfirmDialog>
        ) : null}

        {confirm === "delete" ? <DeleteAccountDialog onCancel={() => setConfirm(null)} /> : null}
      </div>
    </div>,
    document.body
  );
}

/* ───────────────────────── Profile ───────────────────────── */

type SectionProps = {
  draft: AccountSettings;
  update: (patch: (current: AccountSettings) => AccountSettings) => void;
};

function ProfileSection({ draft, update, user }: SectionProps & { user: AuthUser }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pictureError, setPictureError] = useState<string | null>(null);
  const nameId = useId();
  const emailId = useId();
  const displayName = draft.profile.name || user.name || user.email;

  const choosePicture = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const avatar = await resizeProfilePicture(file);
      setPictureError(null);
      update((current) => ({ ...current, profile: { ...current.profile, avatar } }));
    } catch (error) {
      setPictureError(error instanceof Error ? error.message : "Couldn't use that image.");
    }
  };

  return (
    <>
      <Row description="Shown in your account menu. JPG, PNG or WebP." title="Profile picture">
        <div className="flex items-center gap-4">
          {draft.profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- local data URL
            <img alt="" className="h-12 w-12 rounded-full object-cover" src={draft.profile.avatar} />
          ) : (
            <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.07] text-base font-semibold text-slate-300">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex flex-wrap gap-2">
            <button className={`${buttonSecondary} h-8 px-3 text-[13px]`} onClick={() => fileRef.current?.click()} type="button">
              Upload photo
            </button>
            {draft.profile.avatar ? (
              <button
                className="h-8 rounded-md px-2 text-[13px] text-slate-400 transition-colors hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                onClick={() => update((current) => ({ ...current, profile: { ...current.profile, avatar: null } }))}
                type="button"
              >
                Remove
              </button>
            ) : null}
          </div>
          <input accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={choosePicture} ref={fileRef} tabIndex={-1} type="file" />
        </div>
        {pictureError ? <p className="mt-2 text-xs text-rose-300/90">{pictureError}</p> : null}
      </Row>

      <Row description="The name shown across the dashboard." title="Name">
        <label className="sr-only" htmlFor={nameId}>
          Name
        </label>
        <input
          className={inputClass}
          id={nameId}
          maxLength={80}
          onChange={(event) => update((current) => ({ ...current, profile: { ...current.profile, name: event.target.value } }))}
          placeholder={user.name ?? "Your name"}
          value={draft.profile.name}
        />
      </Row>

      <Row
        description="Changing your email needs verification by the account service."
        tag={<NotConnected />}
        title="Email address"
      >
        <label className="sr-only" htmlFor={emailId}>
          Email address
        </label>
        <div className="flex gap-2">
          <input className={inputClass} disabled id={emailId} readOnly value={user.email} />
          <button className={`${buttonSecondary} h-9 shrink-0 px-3 text-[13px] disabled:opacity-40`} disabled type="button">
            Change
          </button>
        </div>
      </Row>
    </>
  );
}

/* ───────────────────────── Security ───────────────────────── */

function SecuritySection({ user }: { user: AuthUser }) {
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const ids = { current: useId(), next: useId(), confirm: useId() };

  const submit = () => {
    if (!values.current || !values.next || !values.confirm) {
      setMessage({ tone: "error", text: "Fill in all three password fields." });
      return;
    }

    if (values.next.length < 8) {
      setMessage({ tone: "error", text: "Your new password must be at least 8 characters." });
      return;
    }

    if (values.next !== values.confirm) {
      setMessage({ tone: "error", text: "The new passwords don't match." });
      return;
    }

    setMessage({
      tone: "info",
      text: "Password changes aren't available yet because the account service isn't set up. Your password hasn't changed."
    });
    setValues({ current: "", next: "", confirm: "" });
  };

  const field = (key: keyof typeof values, label: string, autoComplete: string) => (
    <div>
      <label className="mb-1.5 block text-xs text-slate-500" htmlFor={ids[key]}>
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className={inputClass}
        id={ids[key]}
        onChange={(event) => {
          setMessage(null);
          setValues((current) => ({ ...current, [key]: event.target.value }));
        }}
        type="password"
        value={values[key]}
      />
    </div>
  );

  return (
    <>
      <Row description="Use at least 8 characters." tag={<NotConnected />} title="Change password">
        <div className="space-y-3">
          {field("current", "Current password", "current-password")}
          {field("next", "New password", "new-password")}
          {field("confirm", "Confirm new password", "new-password")}
          {message ? (
            <p className={`text-xs leading-5 ${message.tone === "error" ? "text-rose-300/90" : "text-slate-400"}`} role="status">
              {message.text}
            </p>
          ) : null}
          <button className={`${buttonSecondary} h-8 px-3 text-[13px]`} onClick={submit} type="button">
            Update password
          </button>
        </div>
      </Row>

      <Row description="How you sign in and where you're signed in." tag={<NotConnected />} title="Login credentials">
        <dl className="space-y-3 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Sign-in method</dt>
            <dd className="text-right text-slate-200">Email and password · {user.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Active sessions</dt>
            <dd className="text-right text-slate-200">This browser (current)</dd>
          </div>
        </dl>
        <button className={`${buttonSecondary} mt-4 h-8 px-3 text-[13px] disabled:opacity-40`} disabled type="button">
          Sign out of other sessions
        </button>
      </Row>

      <Row
        description="Ask for a code from an authenticator app each time you log in."
        tag={<NotConnected />}
        title="Two-factor authentication"
      >
        <div className="flex items-center gap-3">
          <Switch checked={false} disabled label="Two-factor authentication" />
          <span className="text-[13px] text-slate-500">Off</span>
        </div>
      </Row>
    </>
  );
}

/* ───────────────────────── Preferences ───────────────────────── */

const notificationOptions: { key: keyof AccountSettings["notifications"]; title: string; description: string }[] = [
  { key: "auditUpdates", title: "Audit status updates", description: "When an audit starts, changes status or completes." },
  { key: "reportAvailable", title: "Report available", description: "When a new audit report is ready to download." },
  { key: "productNews", title: "Product news", description: "Occasional updates about Neuvara." }
];

function PreferencesSection({ draft, update }: SectionProps) {
  return (
    <>
      <Row
        description={
          <>
            Choices are saved now. Emails will be sent once the email service is connected.
          </>
        }
        title="Email notifications"
      >
        <div className="space-y-4">
          {notificationOptions.map((option) => (
            <div className="flex items-start justify-between gap-4" key={option.key}>
              <div>
                <p className="text-[13px] text-slate-200">{option.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{option.description}</p>
              </div>
              <Switch
                checked={draft.notifications[option.key]}
                label={option.title}
                onChange={(checked) =>
                  update((current) => ({ ...current, notifications: { ...current.notifications, [option.key]: checked } }))
                }
              />
            </div>
          ))}
        </div>
      </Row>

      <Row description="Neuvara currently uses a dark theme." title="Theme">
        <RadioList<ThemePreference>
          name="theme"
          onChange={(theme) => update((current) => ({ ...current, theme }))}
          options={[
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light", disabled: true, note: <NotConnected /> },
            { value: "system", label: "Match system", disabled: true, note: <NotConnected /> }
          ]}
          value={draft.theme}
        />
      </Row>

      <Row description="The page you see first when you open your dashboard." title="Start page">
        <RadioList<StartPage>
          name="start-page"
          onChange={(startPage) => update((current) => ({ ...current, startPage }))}
          options={[
            { value: "overview", label: "Overview" },
            { value: "audits", label: "Audits" },
            { value: "reports", label: "Reports" }
          ]}
          value={draft.startPage}
        />
      </Row>
    </>
  );
}

/* ───────────────────────── Privacy ───────────────────────── */

function PrivacySection({
  user,
  saved,
  onClearRequest
}: {
  user: AuthUser;
  saved: AccountSettings;
  onClearRequest: () => void;
}) {
  const downloadData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      account: { id: user.id, email: user.email, name: user.name ?? null },
      savedInThisBrowser: saved
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "neuvara-account-data.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <Row
        description="Download a copy of your account details and the settings saved in this browser."
        title="Your data"
      >
        <div className="flex flex-wrap gap-2">
          <button className={`${buttonSecondary} h-8 px-3 text-[13px]`} onClick={downloadData} type="button">
            Download my data
          </button>
          <button
            className="h-8 rounded-md px-2 text-[13px] text-slate-400 transition-colors hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            onClick={onClearRequest}
            type="button"
          >
            Clear data saved in this browser
          </button>
        </div>
      </Row>

      <Row
        description="Let other people in your organisation see your name on audits and requests."
        tag={<NotConnected />}
        title="Account visibility"
      >
        <div className="flex items-center gap-3">
          <Switch checked={saved.privacy.visibleToOrganisation} disabled label="Visible to my organisation" />
          <span className="text-[13px] text-slate-500">Visible to my organisation</span>
        </div>
      </Row>

      <Row description="How Neuvara handles personal information." title="Privacy policy">
        <Link className="text-[13px] text-slate-200 underline-offset-4 hover:underline" href="/privacy/">
          Read the privacy policy
        </Link>
      </Row>
    </>
  );
}

/* ───────────────────────── Account ───────────────────────── */

function AccountSection({ onSignOut, onDeleteRequest }: { onSignOut: () => void; onDeleteRequest: () => void }) {
  return (
    <>
      <Row description="Sign out of Neuvara in this browser." title="Sign out">
        <button className={`${buttonSecondary} h-8 px-3 text-[13px]`} onClick={onSignOut} type="button">
          Sign out
        </button>
      </Row>

      <Row
        description="Permanently delete your account and personal data. This can't be undone."
        tag={<NotConnected />}
        title="Delete account"
      >
        <button
          className="inline-flex h-8 items-center rounded-md px-3 text-[13px] font-medium text-rose-300 ring-1 ring-inset ring-rose-300/30 transition-colors hover:bg-rose-400/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60"
          onClick={onDeleteRequest}
          type="button"
        >
          Delete account…
        </button>
      </Row>
    </>
  );
}

function DeleteAccountDialog({ onCancel }: { onCancel: () => void }) {
  const [typed, setTyped] = useState("");
  const [step, setStep] = useState<"confirm" | "unavailable">("confirm");
  const inputId = useId();
  const confirmed = typed.trim().toUpperCase() === "DELETE";

  if (step === "unavailable") {
    return (
      <ConfirmDialog
        actions={
          <>
            <a className={`${buttonSecondary} h-8 px-3 text-[13px]`} href="mailto:contact@neuvara.org?subject=Delete%20my%20Neuvara%20account">
              Email Neuvara
            </a>
            <button className={`${buttonPrimary} h-8 px-3 text-[13px]`} onClick={onCancel} type="button">
              Close
            </button>
          </>
        }
        onCancel={onCancel}
        title="Account not deleted"
      >
        Accounts can&apos;t be deleted from here yet because the account service isn&apos;t set up. Nothing has been
        deleted. To delete your account and data now, email contact@neuvara.org.
      </ConfirmDialog>
    );
  }

  return (
    <ConfirmDialog
      actions={
        <>
          <button className={`${buttonSecondary} h-8 px-3 text-[13px]`} onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className="inline-flex h-8 items-center rounded-md bg-rose-500/90 px-3 text-[13px] font-medium text-white transition-colors hover:bg-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!confirmed}
            onClick={() => setStep("unavailable")}
            type="button"
          >
            Delete account
          </button>
        </>
      }
      onCancel={onCancel}
      title="Delete your account?"
    >
      <p>This permanently deletes your account, your access to your organisation&apos;s audits and your personal data. It can&apos;t be undone.</p>
      <label className="mt-4 block text-xs text-slate-500" htmlFor={inputId}>
        Type <span className="font-mono text-slate-300">DELETE</span> to confirm
      </label>
      <input autoComplete="off" className={`${inputClass} mt-1.5`} id={inputId} onChange={(event) => setTyped(event.target.value)} value={typed} />
    </ConfirmDialog>
  );
}
