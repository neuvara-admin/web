"use client";

import { useState } from "react";

const inquiryTypes = ["Research", "Clinical", "Hospital"];
const contactEmail = "contact@neuvara.org";
const fieldLimits = {
  name: 80,
  organisation: 120,
  email: 160,
  message: 1000
};

type FormErrors = Partial<Record<"name" | "organisation" | "email" | "message", string>>;

const styles = {
  default: {
    form: "premium-surface rounded-3xl p-6 sm:p-8",
    eyebrow: "text-xs font-bold uppercase tracking-[0.18em] text-clinical-teal",
    typeGrid: "mt-3 grid gap-2 sm:grid-cols-3",
    typeActive: "rounded-2xl border px-4 py-3 text-sm font-semibold transition duration-300 border-clinical-teal bg-clinical-teal/15 text-clinical-cyan",
    typeIdle: "rounded-2xl border px-4 py-3 text-sm font-semibold transition duration-300 border-white/15 bg-white/5 text-slate-300 hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/10",
    label: "text-sm font-medium text-white",
    input: "mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-clinical-teal",
    textarea: "mt-2 min-h-32 w-full resize-none rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-clinical-teal",
    error: "mt-2 block text-xs font-semibold text-clinical-cyan",
    help: "mt-2 block text-xs leading-5 text-slate-400",
    submit: "mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-clinical-teal px-6 text-sm font-bold text-navy-950 transition duration-300 hover:-translate-y-1 hover:bg-[#65ead9] hover:shadow-lg hover:shadow-clinical-teal/25 sm:w-auto",
    meta: "mt-3 text-sm text-slate-300",
    link: "font-semibold text-clinical-cyan transition hover:text-white",
    status: "mt-4 border-l border-clinical-teal pl-4 text-sm text-slate-300"
  },
  // Quieter variant for the dashboard: flat surface, small radii, compact controls.
  flat: {
    form: "rounded-lg border border-white/[0.08] p-5",
    eyebrow: "text-xs text-slate-500",
    typeGrid: "mt-2 inline-grid grid-cols-3 rounded-md border border-white/[0.1] p-0.5",
    typeActive: "rounded px-3 py-1.5 text-[13px] font-medium bg-white/[0.08] text-slate-100",
    typeIdle: "rounded px-3 py-1.5 text-[13px] text-slate-400 transition-colors hover:text-slate-200",
    label: "text-[13px] font-medium text-slate-200",
    input: "mt-1.5 w-full rounded-md border border-white/[0.1] bg-transparent px-3 py-2 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 hover:border-white/[0.16] focus:border-clinical-teal/70",
    textarea: "mt-1.5 min-h-28 w-full resize-none rounded-md border border-white/[0.1] bg-transparent px-3 py-2 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 hover:border-white/[0.16] focus:border-clinical-teal/70",
    error: "mt-1.5 block text-xs font-medium text-rose-300",
    help: "mt-1.5 block text-xs leading-5 text-slate-500",
    submit: "mt-5 inline-flex h-9 items-center justify-center rounded-md bg-clinical-teal px-4 text-[13px] font-medium text-navy-950 transition-colors hover:bg-[#5fdcc9] active:bg-[#3fc2af] focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical-teal/70 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950",
    meta: "mt-3 text-[13px] text-slate-400",
    link: "font-medium text-slate-200 underline decoration-white/20 underline-offset-2 transition-colors hover:decoration-white/60",
    status: "mt-4 border-t border-white/[0.08] pt-3 text-[13px] text-slate-400"
  }
};

function getFieldValue(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

type ContactFormProps = {
  appearance?: keyof typeof styles;
};

export function ContactForm({ appearance = "default" }: ContactFormProps) {
  const ui = styles[appearance];
  const [selectedType, setSelectedType] = useState(inquiryTypes[0]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState("Select a validation focus to shape the enquiry.");

  return (
    <form
      className={ui.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const honeypot = getFieldValue(formData, "website");

        if (honeypot) {
          setErrors({});
          setStatus("Unable to prepare this enquiry. Please try again.");
          return;
        }

        const name = getFieldValue(formData, "name");
        const organisation = getFieldValue(formData, "organisation");
        const email = getFieldValue(formData, "email");
        const message = getFieldValue(formData, "message");
        const nextErrors: FormErrors = {};

        if (!name) {
          nextErrors.name = "Name is required.";
        }

        if (!organisation) {
          nextErrors.organisation = "Organisation is required.";
        }

        if (!email) {
          nextErrors.email = "Email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          nextErrors.email = "Enter a valid email address.";
        }

        if (!message) {
          nextErrors.message = "Message is required.";
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
          setStatus("Please complete the required fields before preparing the enquiry.");
          return;
        }

        const subject = encodeURIComponent(`${selectedType} enquiry from ${name}`);
        const body = encodeURIComponent(
          [
            `Name: ${name}`,
            `Organisation: ${organisation}`,
            `Email: ${email}`,
            `Validation focus: ${selectedType}`,
            "",
            message
          ].join("\n")
        );

        setStatus(`Opening your email client to contact ${contactEmail}.`);
        window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
      }}
    >
      <div className="mb-6">
        <p className={ui.eyebrow}>
          Validation focus
        </p>
        <div className={ui.typeGrid}>
          {inquiryTypes.map((type) => (
            <button
              aria-pressed={selectedType === type}
              className={selectedType === type ? ui.typeActive : ui.typeIdle}
              key={type}
              onClick={() => {
                setSelectedType(type);
                setErrors({});
                setStatus(`${type} partnership focus selected.`);
              }}
              type="button"
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={ui.label}>
          Name
          <input
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            aria-invalid={Boolean(errors.name)}
            className={ui.input}
            maxLength={fieldLimits.name}
            name="name"
            placeholder="Your name"
            required
            type="text"
          />
          {errors.name ? (
            <span className={ui.error} id="contact-name-error">
              {errors.name}
            </span>
          ) : null}
        </label>
        <label className={ui.label}>
          Organisation
          <input
            aria-describedby={errors.organisation ? "contact-organisation-error" : undefined}
            aria-invalid={Boolean(errors.organisation)}
            className={ui.input}
            maxLength={fieldLimits.organisation}
            name="organisation"
            placeholder="Hospital, university, or company"
            required
            type="text"
          />
          {errors.organisation ? (
            <span className={ui.error} id="contact-organisation-error">
              {errors.organisation}
            </span>
          ) : null}
        </label>
      </div>
      <label className={`mt-4 block ${ui.label}`}>
        Email
        <input
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          aria-invalid={Boolean(errors.email)}
          className={ui.input}
          maxLength={fieldLimits.email}
          name="email"
          placeholder="name@organisation.org"
          required
          type="email"
        />
        {errors.email ? (
          <span className={ui.error} id="contact-email-error">
            {errors.email}
          </span>
        ) : null}
      </label>
      <label className={`mt-4 block ${ui.label}`}>
        Message
        <textarea
          aria-describedby={errors.message ? "contact-message-error contact-message-help" : "contact-message-help"}
          aria-invalid={Boolean(errors.message)}
          className={ui.textarea}
          maxLength={fieldLimits.message}
          name="message"
          placeholder="Tell us about the partnership or validation opportunity."
          required
        />
        {errors.message ? (
          <span className={ui.error} id="contact-message-error">
            {errors.message}
          </span>
        ) : null}
        <span className={ui.help} id="contact-message-help">
          Do not include patient information or confidential medical records. Maximum {fieldLimits.message} characters.
        </span>
      </label>
      <label className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        Website
        <input
          autoComplete="off"
          maxLength={120}
          name="website"
          tabIndex={-1}
          type="text"
        />
      </label>
      <button
        className={ui.submit}
        type="submit"
      >
        Contact Neuvara
      </button>
      <p className={ui.meta}>
        Or email{" "}
        <a className={ui.link} href={`mailto:${contactEmail}`}>
          {contactEmail}
        </a>
      </p>
      <p className={ui.status} aria-live="polite">
        {status}
      </p>
    </form>
  );
}
