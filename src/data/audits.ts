/**
 * AUDIT DATA — PLACEHOLDER VALUES.
 *
 * Model names are anonymised (Model 01, Model 02, …) and shown
 * without a "sample" label, as requested. However, every figure, date,
 * summary and recommendation below is a placeholder and does NOT describe a real
 * audit. Replace these records with real (anonymised) audit results before
 * this page is published.
 *
 * Real client audits must only ever be shown in anonymised form to guests.
 */

export type AuditStatus = "Scheduled" | "In progress" | "Completed";

export type SiteResult = {
  site: string;
  scanner: string;
  fieldStrength: string;
  scans: number;
  value: string;
  status: "Within tolerance" | "Outside tolerance" | "Not yet tested";
};

export type Audit = {
  id: string;
  /** Placeholder record written for layout — replace with a real audit. Not shown in the UI. */
  isPlaceholder: boolean;
  model: string;
  version: string;
  task: string;
  status: AuditStatus;
  /** ISO dates (YYYY-MM-DD). */
  startedOn: string;
  completedOn?: string;
  auditor: string;
  scope: {
    data: string;
    sites: string;
    scanners: string;
    period: string;
  };
  metric: { name: string; tolerance: string };
  siteResults: SiteResult[];
  summary: string;
  recommendations: string[];
};

export const auditRecords: Audit[] = [
  {
    id: "audit-01",
    isPlaceholder: true,
    model: "Model 01",
    version: "2.3",
    task: "Brain MRI segmentation",
    status: "Completed",
    startedOn: "2026-08-18",
    completedOn: "2026-09-12",
    auditor: "Neuvara audit team",
    scope: {
      data: "1,240 T1-weighted scans with reference segmentations",
      sites: "4 sites",
      scanners: "3 manufacturers, 1.5T and 3T",
      period: "Scans acquired 2021–2025"
    },
    metric: { name: "Dice vs. reference", tolerance: "≥ 0.85" },
    siteResults: [
      { site: "Site 1", scanner: "Manufacturer A", fieldStrength: "3T", scans: 410, value: "0.91", status: "Within tolerance" },
      { site: "Site 2", scanner: "Manufacturer B", fieldStrength: "3T", scans: 355, value: "0.89", status: "Within tolerance" },
      { site: "Site 3", scanner: "Manufacturer A", fieldStrength: "1.5T", scans: 290, value: "0.86", status: "Within tolerance" },
      { site: "Site 4", scanner: "Manufacturer C", fieldStrength: "1.5T", scans: 185, value: "0.81", status: "Outside tolerance" }
    ],
    summary:
      "The model performs within tolerance on three of four sites. Performance on Manufacturer C at 1.5T falls below the agreed threshold and should be addressed before wider use.",
    recommendations: [
      "Re-validate on Manufacturer C 1.5T data after retraining.",
      "Introduce input checks on acquisition parameters.",
      "Publish per-site results in the model card."
    ]
  },
  {
    id: "audit-02",
    isPlaceholder: true,
    model: "Model 02",
    version: "1.4",
    task: "Longitudinal atrophy measurement",
    status: "Completed",
    startedOn: "2026-07-01",
    completedOn: "2026-07-29",
    auditor: "Neuvara audit team",
    scope: {
      data: "380 subjects with two or more timepoints",
      sites: "2 sites",
      scanners: "2 manufacturers, 3T",
      period: "Scans acquired 2019–2025"
    },
    metric: { name: "Mean absolute error in annual change", tolerance: "≤ 0.30%" },
    siteResults: [
      { site: "Site 1", scanner: "Manufacturer A", fieldStrength: "3T", scans: 412, value: "0.18%", status: "Within tolerance" },
      { site: "Site 2", scanner: "Manufacturer B", fieldStrength: "3T", scans: 366, value: "0.24%", status: "Within tolerance" }
    ],
    summary:
      "Measured atrophy rates were consistent across both sites and within tolerance. One documentation gap was noted.",
    recommendations: ["Track scanner software versions alongside each scan."]
  },
  {
    id: "audit-03",
    isPlaceholder: true,
    model: "Model 03",
    version: "3.0",
    task: "White matter lesion detection",
    status: "Completed",
    startedOn: "2026-05-11",
    completedOn: "2026-06-20",
    auditor: "Neuvara audit team",
    scope: {
      data: "640 FLAIR scans with expert lesion annotations",
      sites: "3 sites",
      scanners: "3 manufacturers, 1.5T and 3T",
      period: "Scans acquired 2022–2025"
    },
    metric: { name: "Lesion-wise F1", tolerance: "≥ 0.75" },
    siteResults: [
      { site: "Site 1", scanner: "Manufacturer B", fieldStrength: "3T", scans: 260, value: "0.79", status: "Within tolerance" },
      { site: "Site 2", scanner: "Manufacturer A", fieldStrength: "1.5T", scans: 210, value: "0.66", status: "Outside tolerance" },
      { site: "Site 3", scanner: "Manufacturer C", fieldStrength: "3T", scans: 170, value: "0.62", status: "Outside tolerance" }
    ],
    summary:
      "The model did not meet tolerance on two of three sites. It should not be used beyond the original development site until retrained and re-audited.",
    recommendations: [
      "Retrain on harmonised multi-site data.",
      "Re-audit once retraining is complete.",
      "Calibrate confidence scores per site."
    ]
  },
  {
    id: "audit-04",
    isPlaceholder: true,
    model: "Model 04",
    version: "1.1",
    task: "Regional brain volume estimation",
    status: "In progress",
    startedOn: "2026-10-14",
    auditor: "Neuvara audit team",
    scope: {
      data: "900 T1-weighted scans",
      sites: "5 sites",
      scanners: "3 manufacturers, 1.5T and 3T",
      period: "Scans acquired 2020–2026"
    },
    metric: { name: "Intra-class correlation vs. reference", tolerance: "≥ 0.90" },
    siteResults: [
      { site: "Site 1", scanner: "Manufacturer A", fieldStrength: "3T", scans: 220, value: "0.94", status: "Within tolerance" },
      { site: "Site 2", scanner: "Manufacturer B", fieldStrength: "3T", scans: 190, value: "0.92", status: "Within tolerance" },
      { site: "Site 3", scanner: "Manufacturer C", fieldStrength: "1.5T", scans: 160, value: "—", status: "Not yet tested" },
      { site: "Site 4", scanner: "Manufacturer A", fieldStrength: "1.5T", scans: 180, value: "—", status: "Not yet tested" },
      { site: "Site 5", scanner: "Manufacturer B", fieldStrength: "1.5T", scans: 150, value: "—", status: "Not yet tested" }
    ],
    summary: "Audit in progress. Two of five sites have been evaluated so far.",
    recommendations: []
  },
  {
    id: "audit-05",
    isPlaceholder: true,
    model: "Model 05",
    version: "0.9",
    task: "Multi-site MRI harmonisation",
    status: "Scheduled",
    startedOn: "2026-11-24",
    auditor: "Neuvara audit team",
    scope: {
      data: "To be confirmed",
      sites: "3 sites",
      scanners: "2 manufacturers, 3T",
      period: "To be confirmed"
    },
    metric: { name: "Scanner classification accuracy after harmonisation", tolerance: "Close to chance" },
    siteResults: [],
    summary: "Audit scheduled. Scope will be confirmed at the kick-off meeting.",
    recommendations: []
  }
];

/**
 * Audits a visitor may see. Everything here is anonymised, so guests may see
 * all of it. Non-anonymised client audits must come from an authenticated
 * backend and only be shown to permitted signed-in users.
 */
export function getVisibleAudits(): Audit[] {
  return auditRecords;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-12" → "12 Sep 2026" (fixed format so server and browser render the same). */
export function formatAuditDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}
