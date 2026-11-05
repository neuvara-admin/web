"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RequestAuditForm } from "@/components/auth/RequestAuditForm";
import { AuditDetailView, StatusLabel } from "@/components/dashboard/AuditsViews";
import { Box, Section, buttonPrimary, buttonSecondary } from "@/components/dashboard/ui";
import { BrainLogo } from "@/components/ui/Logo";
import { formatAuditDate } from "@/data/audits";
import { getClientWorkspace } from "@/data/client-workspace";
import type { ClientAudit, ClientWorkspace } from "@/data/client-workspace";
import { useAccountSettings, useDisplayProfile } from "@/lib/account-settings";
import type { StartPage } from "@/lib/account-settings";
import { authClient } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import { downloadPlaceholderReport } from "@/lib/placeholder-report";
import { DashboardMenu } from "@/sections/DashboardMenu";

/* ───────────────────────── Navigation ───────────────────────── */

const tabs = [
  { id: "overview", label: "Overview", group: "Workspace", icon: "M2.5 6.5 8 2.5l5.5 4v6.5a.5.5 0 0 1-.5.5H10V10H6v3.5H3a.5.5 0 0 1-.5-.5V6.5Z" },
  { id: "audits", label: "Audits", group: "Workspace", icon: "M5.5 2.5h5v2h-5zM5.5 3.5H3.5v10h9v-10h-2M6 9l1.5 1.5L10.5 7.5" },
  { id: "models", label: "Models", group: "Workspace", icon: "M8 2 2.5 5 8 8l5.5-3L8 2ZM2.5 8 8 11l5.5-3M2.5 11 8 14l5.5-3" },
  { id: "reports", label: "Reports", group: "Workspace", icon: "M4 2h5.5L12 4.5V14H4zM9.5 2v2.5H12M6 8h4M6 10.5h4" },
  { id: "request", label: "Request an audit", group: "Services", icon: "M8 3v10M3 8h10" }
] as const;

type TabId = (typeof tabs)[number]["id"];
type Route = { tab: TabId; auditId: string | null };

function readRoute(startPage: StartPage): Route {
  const [tab, auditId] = window.location.hash.replace(/^#/, "").split("/");

  if (!tabs.some((item) => item.id === tab)) {
    // No section in the address: open the user's chosen start page.
    return { tab: startPage, auditId: null };
  }

  return { tab: tab as TabId, auditId: tab === "audits" && auditId ? auditId : null };
}

function useRoute(startPage: StartPage) {
  const [route, setRoute] = useState<Route>({ tab: "overview", auditId: null });

  useEffect(() => {
    const sync = () => {
      setRoute(readRoute(startPage));
      window.scrollTo({ top: 0 });
    };

    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [startPage]);

  return route;
}

function Icon({ path, className = "h-[15px] w-[15px]" }: { path: string; className?: string }) {
  return (
    <svg aria-hidden className={`${className} shrink-0`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} viewBox="0 0 16 16">
      <path d={path} />
    </svg>
  );
}

const auditHref = (audit: ClientAudit) => `#audits/${audit.id}`;

function AuditDate({ audit }: { audit: ClientAudit }) {
  return audit.completedOn ? (
    <>{formatAuditDate(audit.completedOn)}</>
  ) : (
    <span className="text-slate-500">
      {audit.status === "Scheduled" ? "Starts" : "Started"} {formatAuditDate(audit.startedOn)}
    </span>
  );
}

/* ───────────────────────── Report download ───────────────────────── */

function ReportButton({
  audit,
  organisation,
  size = "sm"
}: {
  audit: ClientAudit;
  organisation: string;
  size?: "sm" | "md";
}) {
  if (!audit.report) {
    return <span className="whitespace-nowrap text-xs text-slate-500">Not yet available</span>;
  }

  const report = audit.report;

  return (
    <button
      aria-label={`Download audit report for ${audit.model} ${audit.version} (PDF)`}
      className={`${buttonSecondary} gap-1.5 whitespace-nowrap ${size === "md" ? "h-8 px-3 text-[13px]" : "h-7 px-2.5 text-xs"}`}
      onClick={() =>
        downloadPlaceholderReport({
          fileName: report.fileName,
          model: audit.model,
          version: audit.version,
          organisation
        })
      }
      type="button"
    >
      <Icon className="h-3.5 w-3.5" path="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />
      {size === "md" ? "Download report (PDF)" : "PDF"}
    </button>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export function ClientDashboard({ user }: { user: AuthUser }) {
  const router = useRouter();
  const settings = useAccountSettings(user.id);
  const profile = useDisplayProfile(user);
  const { tab, auditId } = useRoute(settings.startPage);
  const workspace = getClientWorkspace(user);
  const activeTab = tabs.find((item) => item.id === tab) ?? tabs[0];
  const selectedAudit = auditId ? workspace?.audits.find((audit) => audit.id === auditId) : undefined;
  const organisation = workspace?.organisation.name ?? "Your organisation";
  const displayName = profile.name;

  const logOut = () => {
    void authClient.logOut();
    router.push("/login/");
  };

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-300">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/[0.07] bg-[#0a1524] lg:flex">
        <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-white/[0.07] px-4">
          <span
            aria-hidden
            className="flex h-6 w-6 items-center justify-center rounded bg-white/[0.08] text-[11px] font-semibold text-slate-200"
          >
            {organisation.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-slate-100">{organisation}</p>
            <p className="text-[11px] leading-4 text-slate-500">Client workspace</p>
          </div>
        </div>

        <nav aria-label="Client dashboard" className="flex-1 overflow-y-auto px-2.5 py-4">
          {(["Workspace", "Services"] as const).map((group) => (
            <div className="mb-5" key={group}>
              <p className="mb-1 px-2 text-[11px] font-medium text-slate-500">{group}</p>
              <ul className="space-y-px">
                {tabs
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const isActive = tab === item.id;

                    return (
                      <li key={item.id}>
                        <a
                          aria-current={isActive ? "page" : undefined}
                          className={`flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical-teal/70 ${
                            isActive
                              ? "bg-white/[0.06] font-medium text-slate-100"
                              : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                          }`}
                          href={`#${item.id}`}
                        >
                          <span className={isActive ? "text-slate-300" : "text-slate-500"}>
                            <Icon path={item.icon} />
                          </span>
                          {item.label}
                        </a>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/[0.07] p-4">
          <div className="flex items-center gap-2.5">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- local data URL
              <img alt="" className="h-7 w-7 rounded-full object-cover" src={profile.avatar} />
            ) : (
              <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-xs font-semibold text-slate-300">
                {profile.initial}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-slate-200">{displayName}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <button className={`${buttonSecondary} mt-3 h-7 w-full text-xs`} onClick={logOut} type="button">
            Log out
          </button>
          <Link className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300" href="/">
            <BrainLogo size={12} />
            Neuvara website
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-navy-950">
          <div className="flex h-12 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 text-[13px]">
              <span className="truncate text-slate-500">{organisation}</span>
              <span aria-hidden className="text-slate-600">/</span>
              {selectedAudit || auditId ? (
                <>
                  <a className="text-slate-500 transition-colors hover:text-slate-200" href="#audits">
                    Audits
                  </a>
                  <span aria-hidden className="text-slate-600">/</span>
                  <span className="truncate font-medium text-slate-200">
                    {selectedAudit ? `${selectedAudit.model} v${selectedAudit.version}` : "Not found"}
                  </span>
                </>
              ) : (
                <span className="truncate font-medium text-slate-200">{activeTab.label}</span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {tab !== "request" ? (
                <a className={`${buttonPrimary} hidden h-8 gap-1.5 px-3 text-[13px] sm:inline-flex`} href="#request">
                  <Icon className="h-3.5 w-3.5" path="M8 3v10M3 8h10" />
                  Request an audit
                </a>
              ) : null}
              <DashboardMenu appearance="app" />
            </div>
          </div>

          {/* Tabs below the large-screen breakpoint */}
          <nav aria-label="Client dashboard" className="border-t border-white/[0.07] lg:hidden">
            <ul className="flex overflow-x-auto px-2 sm:px-4">
              {tabs.map((item) => {
                const isActive = tab === item.id;

                return (
                  <li className="shrink-0" key={item.id}>
                    <a
                      aria-current={isActive ? "page" : undefined}
                      className={`flex h-10 items-center border-b-2 px-2.5 text-[13px] transition-colors focus:outline-none focus-visible:text-slate-100 ${
                        isActive
                          ? "border-clinical-teal font-medium text-slate-100"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                      href={`#${item.id}`}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
          <div className="mx-auto max-w-6xl">
            {!workspace ? (
              <NoWorkspace />
            ) : tab === "overview" ? (
              <OverviewView displayName={displayName} workspace={workspace} />
            ) : tab === "audits" && auditId ? (
              selectedAudit ? (
                <AuditPage audit={selectedAudit} organisation={organisation} />
              ) : (
                <NotFound />
              )
            ) : tab === "audits" ? (
              <AuditsView workspace={workspace} />
            ) : tab === "models" ? (
              <ModelsView workspace={workspace} />
            ) : tab === "reports" ? (
              <ReportsView workspace={workspace} />
            ) : (
              <RequestView displayName={displayName} user={user} workspace={workspace} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ───────────────────────── Building blocks ───────────────────────── */

function PageHeader({ title, description, children }: { title: ReactNode; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.07] pb-6">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-slate-50">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-400">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Body({ children }: { children: ReactNode }) {
  return <div className="space-y-10 pt-8">{children}</div>;
}

const th = "px-4 py-2 font-normal";
const tableHead = "border-b border-white/[0.08] bg-white/[0.02] text-xs text-slate-500";

function EmptyRow({ children }: { children: ReactNode }) {
  return <div className="px-4 py-8 text-center text-[13px] text-slate-500">{children}</div>;
}

/* ───────────────────────── Overview ───────────────────────── */

function OverviewView({ displayName, workspace }: { displayName: string; workspace: ClientWorkspace }) {
  const firstName = displayName.split(" ")[0];
  const { audits, models, organisation } = workspace;
  const active = audits.filter((audit) => audit.status !== "Completed");
  const completed = audits
    .filter((audit) => audit.status === "Completed")
    .sort((a, b) => (b.completedOn ?? "").localeCompare(a.completedOn ?? ""));
  const reports = audits.filter((audit) => audit.report);

  const summary = [
    { label: "Models", value: models.length, href: "#models" },
    { label: "Completed audits", value: completed.length, href: "#audits" },
    { label: "In progress or scheduled", value: active.length, href: "#audits" },
    { label: "Reports available", value: reports.length, href: "#reports" }
  ];

  return (
    <>
      <PageHeader
        description={`${organisation.name} · Here's where your audits stand.`}
        title={`Welcome back, ${firstName}`}
      />
      <Body>
        <Box className="overflow-hidden">
          <dl className="grid grid-cols-2 gap-px bg-white/[0.06] lg:grid-cols-4">
            {summary.map((item) => (
              <a className="group bg-navy-950 px-4 py-3 transition-colors hover:bg-white/[0.02]" href={item.href} key={item.label}>
                <dt className="text-xs text-slate-500">{item.label}</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-100">{item.value}</dd>
              </a>
            ))}
          </dl>
        </Box>

        <Section description="Audits that are under way or booked in." title="In progress and upcoming">
          <Box>
            {active.length === 0 ? (
              <EmptyRow>No audits in progress right now.</EmptyRow>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {active.map((audit) => (
                  <li key={audit.id}>
                    <a className="group flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-white/[0.025]" href={auditHref(audit)}>
                      <span className="w-40 shrink-0 text-[13px] font-medium text-slate-200">
                        {audit.model} <span className="font-normal text-slate-500">v{audit.version}</span>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-slate-500">{audit.task}</span>
                      <span className="text-[13px] text-slate-400">
                        <AuditDate audit={audit} />
                      </span>
                      <span className="w-28">
                        <StatusLabel status={audit.status} />
                      </span>
                      <span aria-hidden className="text-slate-600 group-hover:text-slate-300">→</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Box>
        </Section>

        <Section description="Your latest completed audits and their reports." title="Recently completed">
          <Box>
            {completed.length === 0 ? (
              <EmptyRow>No completed audits yet.</EmptyRow>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {completed.slice(0, 3).map((audit) => (
                  <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3" key={audit.id}>
                    <a className="w-40 shrink-0 text-[13px] font-medium text-slate-200 hover:text-white" href={auditHref(audit)}>
                      {audit.model} <span className="font-normal text-slate-500">v{audit.version}</span>
                    </a>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-slate-500">
                      Completed <AuditDate audit={audit} />
                    </span>
                    <ReportButton audit={audit} organisation={organisation.name} />
                    <a className={`${buttonSecondary} h-7 px-2.5 text-xs`} href={auditHref(audit)}>
                      View audit
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Box>
        </Section>

        <Box className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Audit another model</h2>
            <p className="mt-0.5 text-[13px] text-slate-400">
              Request an audit for a new model or a new version. We&apos;ll get back to you to agree scope and timing.
            </p>
          </div>
          <a className={`${buttonPrimary} h-8 px-3 text-[13px]`} href="#request">
            Request an audit
          </a>
        </Box>
      </Body>
    </>
  );
}

/* ───────────────────────── Audits ───────────────────────── */

function AuditsView({ workspace }: { workspace: ClientWorkspace }) {
  const [filter, setFilter] = useState<"All" | ClientAudit["status"]>("All");
  const audits = workspace.audits.filter((audit) => filter === "All" || audit.status === filter);

  return (
    <>
      <PageHeader description="Every audit of your organisation's models." title="Audits">
        <label className="flex items-center gap-2 text-[13px] text-slate-500">
          Status
          <select
            className="h-8 rounded-md border border-white/[0.1] bg-navy-950 px-2.5 text-[13px] text-slate-200 outline-none hover:border-white/[0.16] focus:border-clinical-teal/70"
            onChange={(event) => setFilter(event.target.value as typeof filter)}
            value={filter}
          >
            {["All", "Completed", "In progress", "Scheduled"].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </PageHeader>
      <Body>
        <Box className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-left">
            <thead>
              <tr className={tableHead}>
                <th className={th} scope="col">Model</th>
                <th className={th} scope="col">Task</th>
                <th className={th} scope="col">Audited</th>
                <th className={th} scope="col">Status</th>
                <th className={th} scope="col">Report</th>
                <th className={th} scope="col"><span className="sr-only">Audit page</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-[13px]">
              {audits.map((audit) => (
                <tr className="hover:bg-white/[0.02]" key={audit.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-200">
                    {audit.model} <span className="font-normal text-slate-500">v{audit.version}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{audit.task}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-400"><AuditDate audit={audit} /></td>
                  <td className="px-4 py-3"><StatusLabel status={audit.status} /></td>
                  <td className="px-4 py-2.5"><ReportButton audit={audit} organisation={workspace.organisation.name} /></td>
                  <td className="px-4 py-2.5 text-right">
                    <a className={`${buttonSecondary} h-7 whitespace-nowrap px-2.5 text-xs`} href={auditHref(audit)}>
                      View audit
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {audits.length === 0 ? <EmptyRow>No audits match this filter.</EmptyRow> : null}
        </Box>
      </Body>
    </>
  );
}

function AuditPage({ audit, organisation }: { audit: ClientAudit; organisation: string }) {
  return (
    <>
      <a className="mb-3 inline-block text-[13px] text-slate-400 transition-colors hover:text-slate-200" href="#audits">
        ← All audits
      </a>
      <PageHeader
        description={audit.task}
        title={
          <>
            {audit.model} <span className="font-normal text-slate-500">v{audit.version}</span>
          </>
        }
      >
        <ReportButton audit={audit} organisation={organisation} size="md" />
      </PageHeader>
      <Body>
        {!audit.report ? (
          <p className="text-[13px] text-slate-500">
            The audit report (PDF) will be available here once the audit is complete.
          </p>
        ) : (
          <p className="text-[13px] text-slate-500">
            Report uploaded {formatAuditDate(audit.report.uploadedOn)} · {audit.report.sizeLabel}
          </p>
        )}
        <AuditDetailView audit={audit} />
      </Body>
    </>
  );
}

/* ───────────────────────── Models ───────────────────────── */

function ModelsView({ workspace }: { workspace: ClientWorkspace }) {
  return (
    <>
      <PageHeader description="The models Neuvara has audited or is auditing for you." title="Models" />
      <Body>
        <Box className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <thead>
              <tr className={tableHead}>
                <th className={th} scope="col">Model</th>
                <th className={th} scope="col">Task</th>
                <th className={th} scope="col">Versions audited</th>
                <th className={th} scope="col">Latest audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-[13px]">
              {workspace.models.map((model) => {
                const modelAudits = workspace.audits
                  .filter((audit) => audit.modelId === model.id)
                  .sort((a, b) => b.startedOn.localeCompare(a.startedOn));
                const latest = modelAudits[0];

                return (
                  <tr key={model.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-200">{model.name}</td>
                    <td className="px-4 py-3 text-slate-400">{model.task}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {[...new Set(modelAudits.map((audit) => `v${audit.version}`))].join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {latest ? (
                        <a className="inline-flex items-center gap-3 hover:text-white" href={auditHref(latest)}>
                          <span className="text-slate-300">v{latest.version}</span>
                          <StatusLabel status={latest.status} />
                        </a>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      </Body>
    </>
  );
}

/* ───────────────────────── Reports ───────────────────────── */

function ReportsView({ workspace }: { workspace: ClientWorkspace }) {
  const withReports = workspace.audits
    .filter((audit) => audit.report)
    .sort((a, b) => (b.report?.uploadedOn ?? "").localeCompare(a.report?.uploadedOn ?? ""));

  return (
    <>
      <PageHeader description="Download the PDF report for each completed audit." title="Reports" />
      <Body>
        <Box className="overflow-x-auto">
          {withReports.length === 0 ? (
            <EmptyRow>Reports appear here once an audit is complete.</EmptyRow>
          ) : (
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <thead>
                <tr className={tableHead}>
                  <th className={th} scope="col">Report</th>
                  <th className={th} scope="col">Model</th>
                  <th className={th} scope="col">Uploaded</th>
                  <th className={th} scope="col">Size</th>
                  <th className={th} scope="col"><span className="sr-only">Download</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-[13px]">
                {withReports.map((audit) => (
                  <tr key={audit.id}>
                    <td className="px-4 py-3 text-slate-200">
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-500" path="M4 2h5.5L12 4.5V14H4zM9.5 2v2.5H12" />
                        {audit.report?.fileName}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                      <a className="hover:text-white" href={auditHref(audit)}>
                        {audit.model} v{audit.version}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                      {audit.report ? formatAuditDate(audit.report.uploadedOn) : ""}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{audit.report?.sizeLabel}</td>
                    <td className="px-4 py-2.5 text-right">
                      <ReportButton audit={audit} organisation={workspace.organisation.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Box>
      </Body>
    </>
  );
}

/* ───────────────────────── Request an audit ───────────────────────── */

function RequestView({ displayName, user, workspace }: { displayName: string; user: AuthUser; workspace: ClientWorkspace }) {
  return (
    <>
      <PageHeader
        description="Tell us about the model or version you'd like audited. We'll get back to you to agree scope and timing."
        title="Request an audit"
      />
      <Body>
        <div className="max-w-lg">
          <RequestAuditForm
            defaults={{
              name: displayName,
              email: user.email.includes("@") ? user.email : "",
              organisation: workspace.organisation.name
            }}
          />
        </div>
      </Body>
    </>
  );
}

/* ───────────────────────── States ───────────────────────── */

function NotFound() {
  return (
    <Box className="px-4 py-10 text-center">
      <p className="text-[13px] text-slate-300">This audit doesn&apos;t exist or isn&apos;t available to you.</p>
      <a className={`${buttonSecondary} mt-3 h-7 px-3 text-xs`} href="#audits">
        Back to audits
      </a>
    </Box>
  );
}

function NoWorkspace() {
  return (
    <Box className="px-4 py-10 text-center">
      <p className="text-[13px] text-slate-300">Your workspace isn&apos;t set up yet.</p>
      <p className="mt-1 text-[13px] text-slate-500">Contact Neuvara and we&apos;ll get you set up.</p>
    </Box>
  );
}
