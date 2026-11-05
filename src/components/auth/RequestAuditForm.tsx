"use client";

import { useId, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { authPageFormStyles as ui } from "@/components/auth/AuthForms";

const CONTACT_EMAIL = "contact@neuvara.org";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = "name" | "organisation" | "email" | "model" | "message";
type Errors = Partial<Record<Field, string>>;

const limits: Record<Field, number> = {
  name: 80,
  organisation: 120,
  email: 160,
  model: 300,
  message: 1000
};

function FormField({
  children,
  error,
  hint,
  id,
  label,
  optional = false
}: {
  children: ReactNode;
  error?: string;
  hint?: string;
  id: string;
  label: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label className={ui.label} htmlFor={id}>
        {label}
        {optional ? <span className="ml-1.5 text-slate-600">(optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p className={ui.fieldError} id={`${id}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="mt-2 text-xs leading-5 text-slate-500" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Request an audit (and a personalised client dashboard). Like the site's
 * contact form, it prepares an email to Neuvara in the visitor's email app —
 * nothing is sent to a server.
 */
type RequestAuditFormProps = {
  /** Shows "Already a client? Log in" under the form (Log In page only). */
  onBackToLogIn?: () => void;
  /** Pre-filled values, e.g. for a signed-in client. */
  defaults?: Partial<Record<Field, string>>;
};

export function RequestAuditForm({ onBackToLogIn, defaults = {} }: RequestAuditFormProps) {
  const baseId = useId();
  const id = (field: Field) => `${baseId}-${field}`;
  const [values, setValues] = useState<Record<Field, string>>({
    name: "",
    organisation: "",
    email: "",
    model: "",
    message: "",
    ...defaults
  });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<string | null>(null);

  const update = (field: Field) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const inputProps = (field: Field) => ({
    "aria-describedby": errors[field] ? `${id(field)}-error` : undefined,
    "aria-invalid": Boolean(errors[field]),
    className: `${ui.input} ${errors[field] ? ui.inputError : ui.inputOk}`,
    id: id(field),
    maxLength: limits[field],
    name: field,
    value: values[field]
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.trim()])
    ) as Record<Field, string>;

    const nextErrors: Errors = {
      name: trimmed.name ? undefined : "Full name is required.",
      organisation: trimmed.organisation ? undefined : "Organisation is required.",
      email: !trimmed.email
        ? "Work email is required."
        : EMAIL_PATTERN.test(trimmed.email)
          ? undefined
          : "Enter a valid email address.",
      model: trimmed.model ? undefined : "Tell us briefly what your model does."
    };

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      setStatus(null);
      return;
    }

    const subject = encodeURIComponent(`Audit request from ${trimmed.organisation}`);
    const body = encodeURIComponent(
      [
        `Name: ${trimmed.name}`,
        `Organisation: ${trimmed.organisation}`,
        `Email: ${trimmed.email}`,
        "",
        "What the model does:",
        trimmed.model,
        ...(trimmed.message ? ["", "Message:", trimmed.message] : [])
      ].join("\n")
    );

    setStatus(`Opening your email app to send your request to ${CONTACT_EMAIL}.`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <form className={ui.form} noValidate onSubmit={handleSubmit}>
      <FormField error={errors.name} id={id("name")} label="Full name">
        <input {...inputProps("name")} autoComplete="name" onChange={(event) => update("name")(event.target.value)} type="text" />
      </FormField>

      <FormField error={errors.organisation} id={id("organisation")} label="Organisation">
        <input
          {...inputProps("organisation")}
          autoComplete="organization"
          onChange={(event) => update("organisation")(event.target.value)}
          placeholder="Company, hospital or university"
          type="text"
        />
      </FormField>

      <FormField error={errors.email} id={id("email")} label="Work email">
        <input
          {...inputProps("email")}
          autoComplete="email"
          onChange={(event) => update("email")(event.target.value)}
          placeholder="name@organisation.org"
          type="email"
        />
      </FormField>

      <FormField
        error={errors.model}
        hint="For example: brain MRI segmentation, lesion detection or atrophy measurement."
        id={id("model")}
        label="What does your model do?"
      >
        <input
          {...inputProps("model")}
          aria-describedby={errors.model ? `${id("model")}-error` : `${id("model")}-hint`}
          onChange={(event) => update("model")(event.target.value)}
          type="text"
        />
      </FormField>

      <FormField
        hint="Do not include patient information or confidential medical records."
        id={id("message")}
        label="Anything else we should know?"
        optional
      >
        <textarea
          {...inputProps("message")}
          aria-describedby={`${id("message")}-hint`}
          className={`${ui.input} ${ui.inputOk} h-auto min-h-28 resize-none py-2.5`}
          onChange={(event) => update("message")(event.target.value)}
        />
      </FormField>

      <div className={ui.submitWrap}>
        <button className={ui.submit} type="submit">
          Send request
        </button>
      </div>

      {status ? (
        <p className={`${ui.alert} ${ui.alertInfo}`} role="status">
          {status}
        </p>
      ) : null}

      {onBackToLogIn ? (
        <p className={ui.prompt}>
          Already a client?{" "}
          <button className={ui.promptAction} onClick={onBackToLogIn} type="button">
            Log in
          </button>
        </p>
      ) : null}
    </form>
  );
}
