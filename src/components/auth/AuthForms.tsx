"use client";

import { createContext, useContext, useId, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { authClient, getAuthErrorMessage, isTestLoginEmail } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Visual styles for the auth forms. "modal" is the original look used in the
 * Log in / Sign up modals; "page" is the quieter look of the dedicated pages,
 * matching the dashboard. Behaviour is identical in both.
 */
const formStyles = {
  modal: {
    form: "space-y-4",
    label: "block text-sm font-medium text-white",
    input:
      "mt-2 w-full rounded-lg border bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-clinical-teal disabled:cursor-not-allowed disabled:opacity-60",
    inputOk: "border-white/15",
    inputError: "border-rose-300/70",
    passwordInput: "pr-12",
    toggle:
      "absolute right-1.5 top-[calc(50%+0.25rem)] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical-teal disabled:pointer-events-none",
    fieldError: "mt-2 text-xs font-semibold text-rose-300",
    alert: "rounded-xl border px-4 py-3 text-sm leading-6",
    alertError: "border-rose-300/30 bg-rose-400/10 text-rose-100",
    alertInfo: "border-clinical-teal/30 bg-clinical-teal/10 text-clinical-cyan",
    submitWrap: "pt-2",
    submit:
      "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-clinical-teal px-6 text-sm font-bold text-navy-950 shadow-lg shadow-clinical-teal/20 transition duration-300 hover:-translate-y-0.5 hover:bg-[#65ead9] hover:shadow-clinical-teal/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical-teal focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:pointer-events-none disabled:opacity-70",
    prompt: "mt-6 text-center text-sm text-slate-300",
    promptAction: "font-semibold text-clinical-cyan transition hover:text-white focus:outline-none focus-visible:underline",
    inlineLink:
      "inline-flex items-center gap-1.5 text-xs font-semibold text-clinical-cyan transition hover:text-white focus:outline-none focus-visible:underline disabled:opacity-60"
  },
  page: {
    form: "space-y-6",
    label: "block text-[13px] text-slate-400",
    input:
      "mt-2 h-10 w-full rounded-md border-0 bg-white/[0.04] px-3 text-[15px] text-slate-100 outline-none ring-1 ring-inset transition-colors placeholder:text-slate-600 hover:bg-white/[0.055] focus:bg-white/[0.06] focus:ring-white/25 disabled:cursor-not-allowed disabled:opacity-60",
    inputOk: "ring-transparent",
    inputError: "ring-rose-300/40",
    passwordInput: "pr-11",
    toggle:
      "absolute right-1 top-[calc(50%+0.25rem)] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-slate-500 transition-colors hover:text-slate-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30 disabled:pointer-events-none",
    fieldError: "mt-2 text-xs text-rose-300/90",
    alert: "rounded-md px-3 py-2.5 text-[13px] leading-5",
    alertError: "bg-rose-400/[0.08] text-rose-200",
    alertInfo: "bg-white/[0.04] text-slate-300",
    submitWrap: "pt-2",
    submit:
      "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-50 px-4 text-sm font-medium text-navy-950 transition-colors hover:bg-white active:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:pointer-events-none disabled:opacity-60",
    prompt: "mt-10 text-center text-[13px] text-slate-500",
    promptAction:
      "text-slate-200 underline-offset-4 transition-colors hover:text-white hover:underline focus:outline-none focus-visible:underline",
    inlineLink:
      "inline-flex items-center gap-1.5 text-[13px] text-slate-500 transition-colors hover:text-slate-200 focus:outline-none focus-visible:text-slate-100 disabled:opacity-60"
  }
};

export type AuthFormAppearance = keyof typeof formStyles;

/** Styles of the dedicated auth pages, for other forms that sit on those pages. */
export const authPageFormStyles = formStyles.page;

const AppearanceContext = createContext<AuthFormAppearance>("modal");
const useFormStyles = () => formStyles[useContext(AppearanceContext)];

type FieldProps = {
  autoComplete: string;
  disabled: boolean;
  error?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email";
  value: string;
};

function TextField({
  autoComplete,
  disabled,
  error,
  label,
  name,
  onChange,
  placeholder,
  type = "text",
  value
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const ui = useFormStyles();

  return (
    <div>
      <label className={ui.label} htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className={`${ui.input} ${error ? ui.inputError : ui.inputOk}`}
        disabled={disabled}
        id={id}
        maxLength={160}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

type PasswordFieldProps = Omit<FieldProps, "type"> & {
  labelAside?: ReactNode;
};

function PasswordField({
  autoComplete,
  disabled,
  error,
  label,
  labelAside,
  name,
  onChange,
  placeholder,
  value
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const id = useId();
  const errorId = `${id}-error`;
  const ui = useFormStyles();

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className={ui.label} htmlFor={id}>
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className={`${ui.input} ${error ? ui.inputError : ui.inputOk} ${ui.passwordInput}`}
          disabled={disabled}
          id={id}
          maxLength={128}
          name={name}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={isVisible ? "text" : "password"}
          value={value}
        />
        <button
          aria-controls={id}
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          className={ui.toggle}
          disabled={disabled}
          onClick={() => setIsVisible((visible) => !visible)}
          type="button"
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  const ui = useFormStyles();

  if (!message) {
    return null;
  }

  return (
    <p className={ui.fieldError} id={id}>
      {message}
    </p>
  );
}

function FormAlert({ message, tone = "error" }: { message: string; tone?: "error" | "info" }) {
  const ui = useFormStyles();

  return (
    <div
      className={`${ui.alert} ${tone === "error" ? ui.alertError : ui.alertInfo}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </div>
  );
}

function SubmitButton({
  children,
  isLoading,
  loadingLabel
}: {
  children: ReactNode;
  isLoading: boolean;
  loadingLabel: string;
}) {
  const ui = useFormStyles();

  return (
    <button
      aria-busy={isLoading}
      className={ui.submit}
      disabled={isLoading}
      type="submit"
    >
      {isLoading ? (
        <>
          <Spinner />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function SwitchPrompt({
  action,
  onClick,
  prompt
}: {
  action: string;
  onClick: () => void;
  prompt: string;
}) {
  const ui = useFormStyles();

  return (
    <p className={ui.prompt}>
      {prompt}{" "}
      <button
        className={ui.promptAction}
        onClick={onClick}
        type="button"
      >
        {action}
      </button>
    </p>
  );
}

function validateEmail(email: string) {
  if (!email) return "Email address is required.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  return undefined;
}

function hasErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).some(Boolean);
}

/* ─────────────────────────── Sign up ─────────────────────────── */

type SignUpErrors = Partial<Record<"name" | "email" | "password" | "confirmPassword", string>>;

type AuthFormProps = {
  onAuthenticated: (user: AuthUser) => void;
  onSwitch: () => void;
};

export function SignUpForm({ onAuthenticated, onSwitch }: AuthFormProps) {
  const [values, setValues] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field: keyof typeof values) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const name = values.name.trim();
    const email = values.email.trim();
    const nextErrors: SignUpErrors = {
      name: name ? undefined : "Full name is required.",
      email: validateEmail(email),
      password: !values.password
        ? "Password is required."
        : values.password.length < MIN_PASSWORD_LENGTH
          ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
          : undefined,
      confirmPassword: !values.confirmPassword
        ? "Please confirm your password."
        : values.confirmPassword !== values.password
          ? "Passwords do not match."
          : undefined
    };

    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await authClient.signUp({ name, email, password: values.password });
      onAuthenticated(user);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      {formError ? <FormAlert message={formError} /> : null}
      <TextField
        autoComplete="name"
        disabled={isSubmitting}
        error={errors.name}
        label="Full name"
        name="name"
        onChange={update("name")}
        value={values.name}
      />
      <TextField
        autoComplete="email"
        disabled={isSubmitting}
        error={errors.email}
        label="Email address"
        name="email"
        onChange={update("email")}
        placeholder="name@organisation.org"
        type="email"
        value={values.email}
      />
      <PasswordField
        autoComplete="new-password"
        disabled={isSubmitting}
        error={errors.password}
        label="Password"
        name="password"
        onChange={update("password")}
        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        value={values.password}
      />
      <PasswordField
        autoComplete="new-password"
        disabled={isSubmitting}
        error={errors.confirmPassword}
        label="Confirm password"
        name="confirmPassword"
        onChange={update("confirmPassword")}
        placeholder="Re-enter your password"
        value={values.confirmPassword}
      />
      <div className="pt-2">
        <SubmitButton isLoading={isSubmitting} loadingLabel="Creating account…">
          Create Account
        </SubmitButton>
      </div>
      <SwitchPrompt action="Log in" onClick={onSwitch} prompt="Already have an account?" />
    </form>
  );
}

/* ─────────────────────────── Log in ─────────────────────────── */

type LogInErrors = Partial<Record<"email" | "password", string>>;

type SwitchText = { prompt: string; action: string };

type LogInFormProps = AuthFormProps & {
  appearance?: AuthFormAppearance;
  /** Text of the link under the form. Defaults to "Don't have an account? Sign up". */
  switchText?: SwitchText;
};

export function LogInForm({ appearance = "modal", ...props }: LogInFormProps) {
  return (
    <AppearanceContext.Provider value={appearance}>
      <LogInFormFields {...props} />
    </AppearanceContext.Provider>
  );
}

function LogInFormFields({
  onAuthenticated,
  onSwitch,
  switchText = { prompt: "Don't have an account?", action: "Sign up" }
}: AuthFormProps & { switchText?: SwitchText }) {
  const ui = useFormStyles();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<LogInErrors>({});
  const [formMessage, setFormMessage] = useState<{ tone: "error" | "info"; text: string } | null>(
    null
  );
  const [pending, setPending] = useState<"login" | "reset" | null>(null);
  const isBusy = pending !== null;

  const update = (field: keyof typeof values) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage(null);

    const email = values.email.trim();
    const nextErrors: LogInErrors = {
      // The development-only test login uses "test", which isn't an email address.
      email: isTestLoginEmail(email) ? undefined : validateEmail(email),
      password: values.password ? undefined : "Password is required."
    };

    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      return;
    }

    setPending("login");

    try {
      const user = await authClient.logIn({ email, password: values.password });
      onAuthenticated(user);
    } catch (error) {
      setFormMessage({ tone: "error", text: getAuthErrorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const handleForgotPassword = async () => {
    setFormMessage(null);

    const email = values.email.trim();
    const emailError = email
      ? validateEmail(email)
      : "Enter your email address above to reset your password.";

    setErrors({ email: emailError });

    if (emailError) {
      return;
    }

    setPending("reset");

    try {
      await authClient.requestPasswordReset(email);
      setFormMessage({
        tone: "info",
        text: `If an account exists for ${email}, a password reset link is on its way.`
      });
    } catch (error) {
      setFormMessage({ tone: "error", text: getAuthErrorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  return (
    <form className={ui.form} noValidate onSubmit={handleSubmit}>
      {formMessage ? <FormAlert message={formMessage.text} tone={formMessage.tone} /> : null}
      <TextField
        autoComplete="email"
        disabled={isBusy}
        error={errors.email}
        label="Email address"
        name="email"
        onChange={update("email")}
        placeholder="name@organisation.org"
        type="email"
        value={values.email}
      />
      <PasswordField
        autoComplete="current-password"
        disabled={isBusy}
        error={errors.password}
        label="Password"
        labelAside={
          <button
            className={ui.inlineLink}
            disabled={isBusy}
            onClick={handleForgotPassword}
            type="button"
          >
            {pending === "reset" ? <Spinner small /> : null}
            Forgot password?
          </button>
        }
        name="password"
        onChange={update("password")}
        placeholder="Enter your password"
        value={values.password}
      />
      <div className={ui.submitWrap}>
        <SubmitButton isLoading={pending === "login"} loadingLabel="Logging in…">
          Log In
        </SubmitButton>
      </div>
      <SwitchPrompt action={switchText.action} onClick={onSwitch} prompt={switchText.prompt} />
    </form>
  );
}

/* ─────────────────────────── Icons ─────────────────────────── */

function Spinner({ small = false }: { small?: boolean }) {
  return (
    <svg
      aria-hidden
      className={`animate-spin ${small ? "h-3 w-3" : "h-4 w-4"}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a10.4 10.4 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m3 3 18 18" />
    </svg>
  );
}
