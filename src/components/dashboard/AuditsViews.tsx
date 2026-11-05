"use client";

import { useMemo, useState } from "react";
import { Box, Section, buttonSecondary } from "@/components/dashboard/ui";
import { formatAuditDate } from "@/data/audits";
import type { Audit, AuditStatus, SiteResult } from "@/data/audits";

export const auditHref = (audit: Audit) => `#audits/${audit.id}`;

/* ───────────────────────── Small labels ───────────────────────── */

const statusDot: Record<AuditStatus, string> = {
  Completed: "bg-clinical-teal",
  "In progress": "bg-clinical-blue",
  Scheduled: "bg-slate-500"
};

export function StatusLabel({ status }: { status: AuditStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-slate-300">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${statusDot[status]}`} />
      {status}
    </span>
  );
}

export function AnonymisedNotice() {
  return (
    <p className="flex items-center gap-2 text-[13px] text-slate-500">
      <svg aria-hidden className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} viewBox="0 0 16 16">
        <rect height="6.5" rx="1" width="9" x="3.5" y="7" />
        <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
      </svg>
      Model names are anonymised to protect client confidentiality.
    </p>
  );
}

/* ───────────────────────── Audits list ───────────────────────── */

const statusOptions: (AuditStatus | "All")[] = ["All", "Completed", "In progress", "Scheduled"];

const controlClass =
  "h-8 rounded-md border border-white/[0.1] bg-navy-950 px-2.5 text-[13px] text-slate-200 outline-none transition-colors hover:border-white/[0.16] focus:border-clinical-teal/70";

function AuditDate({ audit }: { audit: Audit }) {
  return audit.completedOn ? (
    <>{formatAuditDate(audit.completedOn)}</>
  ) : (
    <span className="text-slate-500">
      {audit.status === "Scheduled" ? "Starts" : "Started"} {formatAuditDate(audit.startedOn)}
    </span>
  );
}

export function AuditsListView({ audits }: { audits: Audit[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AuditStatus | "All">("All");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return audits.filter((audit) => {
      const matchesQuery =
        !needle || [audit.model, audit.version, audit.task].some((value) => value.toLowerCase().includes(needle));

      return matchesQuery && (status === "All" || audit.status === status);
    });
  }, [audits, query, status]);

  const isFiltered = query !== "" || status !== "All";

  return (
    <>
      <AnonymisedNotice />

      <section aria-label="Audits">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <svg aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={1.5} viewBox="0 0 16 16">
              <circle cx="7" cy="7" r="4.75" />
              <path d="m10.5 10.5 3 3" />
            </svg>
            <input
              aria-label="Search audits"
              className={`${controlClass} w-full pl-8 placeholder:text-slate-500`}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search model or task"
              type="search"
              value={query}
            />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-slate-500">
            Status
            <select className={controlClass} onChange={(event) => setStatus(event.target.value as AuditStatus | "All")} value={status}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <p aria-live="polite" className="ml-auto text-xs text-slate-500">
            {filtered.length} of {audits.length} audits
          </p>
        </div>

        <Box className="overflow-hidden">
          {/* Phones: stacked list */}
          <ul className="divide-y divide-white/[0.06] md:hidden">
            {filtered.map((audit) => (
              <li key={audit.id}>
                <a
                  className="block px-4 py-3 transition-colors hover:bg-white/[0.02] focus:outline-none focus-visible:bg-white/[0.04]"
                  href={auditHref(audit)}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-medium text-slate-200">
                      {audit.model} <span className="font-normal text-slate-500">v{audit.version}</span>
                    </span>
                    <span aria-hidden className="text-slate-600">→</span>
                  </span>
                  <span className="mt-0.5 block text-[13px] text-slate-400">{audit.task}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-400">
                    <StatusLabel status={audit.status} />
                    <AuditDate audit={audit} />
                  </span>
                </a>
              </li>
            ))}
          </ul>

          {/* Tablet and up: table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-xs text-slate-500">
                  <th className="px-4 py-2 font-normal" scope="col">Model</th>
                  <th className="px-4 py-2 font-normal" scope="col">Task</th>
                  <th className="px-4 py-2 font-normal" scope="col">Audited</th>
                  <th className="px-4 py-2 font-normal" scope="col">Status</th>
                  <th className="px-4 py-2 font-normal" scope="col">
                    <span className="sr-only">Audit page</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filtered.map((audit) => (
                  <tr className="transition-colors hover:bg-white/[0.02]" key={audit.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium text-slate-200">
                      {audit.model} <span className="font-normal text-slate-500">v{audit.version}</span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-400">{audit.task}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] text-slate-400">
                      <AuditDate audit={audit} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusLabel status={audit.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <a
                        aria-label={`View audit for ${audit.model} ${audit.version}`}
                        className={`${buttonSecondary} h-7 whitespace-nowrap px-2.5 text-xs`}
                        href={auditHref(audit)}
                      >
                        View audit
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 ? (
            <div className="border-t border-white/[0.06] px-4 py-10 text-center">
              <p className="text-[13px] text-slate-300">No audits match your filters.</p>
              {isFiltered ? (
                <button
                  className={`${buttonSecondary} mt-3 h-7 px-3 text-xs`}
                  onClick={() => {
                    setQuery("");
                    setStatus("All");
                  }}
                  type="button"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : null}
        </Box>
      </section>
    </>
  );
}

/* ───────────────────────── Recent audits (overview) ───────────────────────── */

export function RecentAudits({ audits }: { audits: Audit[] }) {
  const recent = audits.filter((audit) => audit.status !== "Scheduled").slice(0, 3);

  return (
    <Section title="Recent audits">
      <Box>
        <ul className="divide-y divide-white/[0.06]">
          {recent.map((audit) => (
            <li key={audit.id}>
              <a
                className="group flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-white/[0.025] focus:outline-none focus-visible:bg-white/[0.04]"
                href={auditHref(audit)}
              >
                <span className="w-40 shrink-0 text-[13px] font-medium text-slate-200">
                  {audit.model} <span className="font-normal text-slate-500">v{audit.version}</span>
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-slate-500">{audit.task}</span>
                <StatusLabel status={audit.status} />
                <span aria-hidden className="text-slate-600 transition-colors group-hover:text-slate-300">
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/[0.06] px-4 py-2.5">
          <a className="text-[13px] text-slate-400 transition-colors hover:text-slate-200" href="#audits">
            View all audits
          </a>
        </div>
      </Box>
    </Section>
  );
}

/* ───────────────────────── Audit page ───────────────────────── */

const siteStatusColor: Record<SiteResult["status"], string> = {
  "Within tolerance": "text-slate-300",
  "Outside tolerance": "text-rose-300",
  "Not yet tested": "text-slate-500"
};

export function AuditDetailView({ audit }: { audit: Audit }) {
  const period = audit.completedOn
    ? `${formatAuditDate(audit.startedOn)} – ${formatAuditDate(audit.completedOn)}`
    : `${audit.status === "Scheduled" ? "Starts" : "Started"} ${formatAuditDate(audit.startedOn)}`;

  const facts = [
    { label: "Status", value: <StatusLabel status={audit.status} /> },
    { label: "Audit period", value: period },
    { label: "Auditor", value: audit.auditor },
    { label: "Metric", value: `${audit.metric.name} (target ${audit.metric.tolerance})` }
  ];

  return (
    <>
      <Box className="overflow-hidden">
        <dl className="grid gap-px bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact) => (
            <div className="bg-navy-950 px-4 py-3" key={fact.label}>
              <dt className="text-xs text-slate-500">{fact.label}</dt>
              <dd className="mt-1 text-[13px] text-slate-200">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </Box>

      <Section title="Scope">
        <Box>
          <dl className="divide-y divide-white/[0.06]">
            {(
              [
                ["Data", audit.scope.data],
                ["Sites", audit.scope.sites],
                ["Scanners", audit.scope.scanners],
                ["Period", audit.scope.period]
              ] as const
            ).map(([term, detail]) => (
              <div className="grid gap-1 px-4 py-3 sm:grid-cols-[13rem_1fr] sm:gap-6" key={term}>
                <dt className="text-[13px] font-medium text-slate-200">{term}</dt>
                <dd className="text-[13px] leading-6 text-slate-400">{detail}</dd>
              </div>
            ))}
          </dl>
        </Box>
      </Section>

      <Section
        description={`${audit.metric.name}. Target ${audit.metric.tolerance}.`}
        title="Results by site and scanner"
      >
        {audit.siteResults.length === 0 ? (
          <Box className="px-4 py-6 text-center text-[13px] text-slate-500">
            No results yet. Results appear here once testing starts.
          </Box>
        ) : (
          <Box className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-xs text-slate-500">
                  <th className="px-4 py-2 font-normal" scope="col">Site</th>
                  <th className="px-4 py-2 font-normal" scope="col">Scanner</th>
                  <th className="px-4 py-2 font-normal" scope="col">Field strength</th>
                  <th className="px-4 py-2 text-right font-normal" scope="col">Scans</th>
                  <th className="px-4 py-2 text-right font-normal" scope="col">Value</th>
                  <th className="px-4 py-2 font-normal" scope="col">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-[13px]">
                {audit.siteResults.map((row) => (
                  <tr key={row.site}>
                    <td className="px-4 py-2.5 font-medium text-slate-200">{row.site}</td>
                    <td className="px-4 py-2.5 text-slate-400">{row.scanner}</td>
                    <td className="px-4 py-2.5 text-slate-400">{row.fieldStrength}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-400">{row.scans.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[12px] tabular-nums text-slate-200">{row.value}</td>
                    <td className={`px-4 py-2.5 ${siteStatusColor[row.status]}`}>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </Section>

      <Section title="Summary">
        <Box className="px-4 py-4">
          <p className="text-[13px] leading-6 text-slate-300">{audit.summary}</p>
          {audit.recommendations.length > 0 ? (
            <>
              <h3 className="mt-4 text-xs text-slate-500">Recommendations</h3>
              <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-[13px] leading-6 text-slate-300 marker:text-slate-500">
                {audit.recommendations.map((recommendation) => (
                  <li key={recommendation}>{recommendation}</li>
                ))}
              </ol>
            </>
          ) : null}
        </Box>
      </Section>
    </>
  );
}

export function AuditNotFound() {
  return (
    <Box className="px-4 py-10 text-center">
      <p className="text-[13px] text-slate-300">This audit doesn&apos;t exist or isn&apos;t available to you.</p>
      <a className={`${buttonSecondary} mt-3 h-7 px-3 text-xs`} href="#audits">
        Back to all audits
      </a>
    </Box>
  );
}
