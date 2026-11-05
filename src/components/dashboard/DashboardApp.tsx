"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import type { AuthView } from "@/components/auth/AuthModal";
import { BrainLogo } from "@/components/ui/Logo";
import { useAuthUser } from "@/lib/auth";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";
import { endGuestSession, startGuestSession, useGuestStatus } from "@/lib/guest";
import { ContactForm } from "@/sections/ContactForm";
import { DashboardMenu } from "@/sections/DashboardMenu";
import { partnershipSegments } from "@/sections/PartnershipSegments";
import { Box, Section, buttonPrimary, buttonSecondary } from "@/components/dashboard/ui";
import {
  AuditDetailView,
  AuditNotFound,
  AuditsListView,
  RecentAudits
} from "@/components/dashboard/AuditsViews";
import { getVisibleAudits } from "@/data/audits";
import type { Audit } from "@/data/audits";

/* ───────────────────────── Navigation ───────────────────────── */

const sections = [
  {
    id: "overview",
    label: "Overview",
    group: "Workspace",
    icon: "M2.5 6.5 8 2.5l5.5 4v6.5a.5.5 0 0 1-.5.5H10V10H6v3.5H3a.5.5 0 0 1-.5-.5V6.5Z",
    description:
      "The most recent audits. You're browsing as a guest, so no account is needed and nothing is saved."
  },
  {
    id: "audits",
    label: "Audits",
    group: "Workspace",
    icon: "M5.5 2.5h5v2h-5zM5.5 3.5H3.5v10h9v-10h-2M6 9l1.5 1.5L10.5 7.5",
    description:
      "Independent audits of client models: how each model performs across sites and scanners, what was found, and what was recommended."
  },
  {
    id: "contact",
    label: "Contact",
    group: "Company",
    icon: "M2 3.5h12v9H2zM2.5 4l5.5 4.5L13.5 4",
    description:
      "We are seeking research, clinical, hospital, and strategic partners for retrospective studies, scanner generalisation research, and privacy-conscious evaluation pathways."
  }
] as const;

type SectionId = (typeof sections)[number]["id"];
const navGroups = ["Workspace", "Company"] as const;

type Route = { section: SectionId; auditId: string | null };

/** Reads "#section" or "#audits/<audit id>" from the address bar. */
function readRouteFromHash(): Route {
  const [section, auditId] = window.location.hash.replace(/^#/, "").split("/");

  if (!sections.some((item) => item.id === section)) {
    return { section: "overview", auditId: null };
  }

  return { section: section as SectionId, auditId: section === "audits" && auditId ? auditId : null };
}

/** The current view lives in the URL hash, so refresh and Back/Forward keep your place. */
function useRoute() {
  const [route, setRoute] = useState<Route>({ section: "overview", auditId: null });

  useEffect(() => {
    const sync = () => {
      setRoute(readRouteFromHash());
      window.scrollTo({ top: 0 });
    };

    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return route;
}

function NavIcon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden
      className="h-[15px] w-[15px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.25}
      viewBox="0 0 16 16"
    >
      <path d={path} />
    </svg>
  );
}

/* ───────────────────────── App ───────────────────────── */

export function DashboardApp() {
  const status = useGuestStatus();
  const user = useAuthUser();
  const { section: active, auditId } = useRoute();
  const [authView, setAuthView] = useState<AuthView | null>(null);
  const closeAuthModal = useCallback(() => setAuthView(null), []);
  const activeSection = sections.find((section) => section.id === active) ?? sections[0];
  const audits = getVisibleAudits();
  const selectedAudit: Audit | undefined = auditId ? audits.find((audit) => audit.id === auditId) : undefined;

  const authModal = (
    <AuthModal
      onAuthenticated={endGuestSession}
      onClose={closeAuthModal}
      onViewChange={setAuthView}
      view={authView}
    />
  );

  if (status === "unknown" || user === undefined) {
    return <main aria-busy className="min-h-screen bg-navy-950" />;
  }

  // Signed-in clients get their own workspace, separate from the guest dashboard.
  if (user) {
    return <ClientDashboard user={user} />;
  }

  if (status === "visitor") {
    return (
      <>
        <AccessGate onAuth={setAuthView} />
        {authModal}
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-300">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/[0.07] bg-[#0a1524] lg:flex">
        <div className="flex h-12 shrink-0 items-center border-b border-white/[0.07] px-4">
          <Link
            aria-label="Neuvara website"
            className="flex items-center gap-2 rounded-md text-sm font-semibold text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical-teal/70"
            href="/"
          >
            <BrainLogo size={18} />
            Neuvara
          </Link>
        </div>

        <nav aria-label="Dashboard sections" className="flex-1 overflow-y-auto px-2.5 py-4">
          {navGroups.map((group) => (
            <div className="mb-5" key={group}>
              <p className="mb-1 px-2 text-[11px] font-medium text-slate-500">{group}</p>
              <ul className="space-y-px">
                {sections
                  .filter((section) => section.group === group)
                  .map((section) => {
                    const isActive = active === section.id;

                    return (
                      <li key={section.id}>
                        <a
                          aria-current={isActive ? "page" : undefined}
                          className={`flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical-teal/70 ${
                            isActive
                              ? "bg-white/[0.06] font-medium text-slate-100"
                              : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                          }`}
                          href={`#${section.id}`}
                        >
                          <span className={isActive ? "text-slate-300" : "text-slate-500"}>
                            <NavIcon path={section.icon} />
                          </span>
                          {section.label}
                        </a>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/[0.07] p-4">
          <p className="text-[13px] font-medium text-slate-200">Guest session</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">Nothing you do here is saved.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className={`${buttonSecondary} h-7 text-xs`} onClick={() => setAuthView("login")} type="button">
              Log in
            </button>
            <button className={`${buttonPrimary} h-7 text-xs`} onClick={() => setAuthView("signup")} type="button">
              Sign up
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-navy-950">
          <div className="flex h-12 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 text-[13px]">
              <Link
                aria-label="Neuvara website"
                className="flex shrink-0 items-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical-teal/70 lg:hidden"
                href="/"
              >
                <BrainLogo size={18} />
              </Link>
              <span aria-hidden className="text-slate-600 lg:hidden">/</span>
              <span className="text-slate-500">Dashboard</span>
              <span aria-hidden className="text-slate-600">/</span>
              {auditId ? (
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
                <span className="truncate font-medium text-slate-200">{activeSection.label}</span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden items-center gap-1.5 rounded border border-white/[0.09] px-1.5 py-0.5 text-[11px] font-medium text-slate-400 sm:inline-flex">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-clinical-teal" />
                Guest access
              </span>
              <DashboardMenu appearance="app" />
            </div>
          </div>

          {/* Section tabs below the large-screen breakpoint */}
          <nav aria-label="Dashboard sections" className="border-t border-white/[0.07] lg:hidden">
            <ul className="flex overflow-x-auto px-2 sm:px-4">
              {sections.map((section) => {
                const isActive = active === section.id;

                return (
                  <li className="shrink-0" key={section.id}>
                    <a
                      aria-current={isActive ? "page" : undefined}
                      className={`flex h-10 items-center border-b-2 px-2.5 text-[13px] transition-colors focus:outline-none focus-visible:text-slate-100 ${
                        isActive
                          ? "border-clinical-teal font-medium text-slate-100"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                      href={`#${section.id}`}
                    >
                      {section.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="border-b border-white/[0.07] pb-6">
              {auditId ? (
                <>
                  <a
                    className="mb-3 inline-block rounded text-[13px] text-slate-400 transition-colors hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical-teal/70"
                    href="#audits"
                  >
                    ← All audits
                  </a>
                  <h1 className="flex flex-wrap items-center gap-2.5 text-[22px] font-semibold tracking-[-0.015em] text-slate-50">
                    {selectedAudit ? (
                      <>
                        {selectedAudit.model}
                        <span className="font-normal text-slate-500">v{selectedAudit.version}</span>
                      </>
                    ) : (
                      "Audit not found"
                    )}
                  </h1>
                  {selectedAudit ? (
                    <p className="mt-1.5 text-sm leading-6 text-slate-400">
                      {selectedAudit.task}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-slate-50">
                    {activeSection.label}
                  </h1>
                  <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-400">
                    {activeSection.description}
                  </p>
                </>
              )}
            </div>

            <div className="space-y-10 pt-8">
              {active === "overview" && <OverviewView audits={audits} />}
              {active === "audits" && !auditId && <AuditsListView audits={audits} />}
              {active === "audits" && auditId && selectedAudit && <AuditDetailView audit={selectedAudit} />}
              {active === "audits" && auditId && !selectedAudit && <AuditNotFound />}
              {active === "contact" && <ContactView />}
            </div>

            <p className="mt-14 border-t border-white/[0.07] pt-5 text-xs leading-5 text-slate-500">
              Neuvara is not a diagnostic device and is not intended to replace specialist clinical review. Any
              clinical use would require appropriate validation and regulatory assessment.
            </p>
          </div>
        </main>
      </div>

      {authModal}
    </div>
  );
}

/* ───────────────────────── Access gate ───────────────────────── */

function AccessGate({ onAuth }: { onAuth: (view: AuthView) => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-16">
      <div className="w-full max-w-sm">
        <BrainLogo size={24} />
        <h1 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-slate-50">Open the Neuvara dashboard</h1>
        <p className="mt-1.5 text-sm leading-6 text-slate-400">
          Continue as a guest to explore without an account, or log in to your account.
        </p>
        <div className="mt-6 space-y-2">
          <button className={`${buttonPrimary} h-9 w-full text-sm`} onClick={startGuestSession} type="button">
            Continue as Guest
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button className={`${buttonSecondary} h-9 text-sm`} onClick={() => onAuth("login")} type="button">
              Log in
            </button>
            <button className={`${buttonSecondary} h-9 text-sm`} onClick={() => onAuth("signup")} type="button">
              Sign up
            </button>
          </div>
        </div>
        <Link
          className="mt-6 inline-block rounded text-[13px] text-slate-400 transition-colors hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical-teal/70"
          href="/"
        >
          ← Back to website
        </Link>
      </div>
    </main>
  );
}

/* ───────────────────────── Views ───────────────────────── */

function OverviewView({ audits }: { audits: Audit[] }) {
  return (
    <>
      <RecentAudits audits={audits} />
    </>
  );
}

function ContactView() {
  return (
    <div className="grid gap-10 lg:grid-cols-[18rem_1fr]">
      <Section title="Who we work with">
        <Box>
          <ul className="divide-y divide-white/[0.06]">
            {partnershipSegments.map((segment) => (
              <li className="px-4 py-2.5 text-[13px] text-slate-300" key={segment}>
                {segment}
              </li>
            ))}
          </ul>
        </Box>
      </Section>

      <Section title="Send an enquiry">
        <ContactForm appearance="flat" />
      </Section>
    </div>
  );
}
