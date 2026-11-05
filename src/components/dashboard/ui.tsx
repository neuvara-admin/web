"use client";

import type { ReactNode } from "react";

/* ───────────────────────── Buttons ───────────────────────── */

export const buttonBase =
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical-teal/70 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950";
export const buttonPrimary = `${buttonBase} bg-clinical-teal text-navy-950 hover:bg-[#5fdcc9] active:bg-[#3fc2af]`;
export const buttonSecondary = `${buttonBase} border border-white/[0.1] text-slate-200 hover:border-white/[0.16] hover:bg-white/[0.04] active:bg-white/[0.07]`;

/* ───────────────────────── Building blocks ───────────────────────── */

export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        {description ? <p className="mt-0.5 text-[13px] text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Box({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-white/[0.08] ${className}`}>{children}</div>;
}
