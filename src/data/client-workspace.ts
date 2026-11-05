/**
 * CLIENT WORKSPACE DATA — TEST ONLY.
 *
 * What a signed-in client sees: their organisation, their models, their
 * audits and their audit reports. There is no backend yet, so the only
 * workspace is the one for the development test login (test / test), filled
 * with placeholder audits. None of it describes a real client or audit.
 *
 * When a backend exists, replace `getClientWorkspace` with a call that loads
 * the signed-in user's own organisation from it. Real reports must be served
 * from private storage — never put client PDFs in this repository, because
 * everything in a static site is publicly downloadable.
 */

import type { AuthUser } from "@/lib/auth";
import { auditRecords } from "@/data/audits";
import type { Audit } from "@/data/audits";

export type AuditReport = {
  fileName: string;
  /** ISO date (YYYY-MM-DD). */
  uploadedOn: string;
  sizeLabel: string;
};

export type ClientAudit = Audit & {
  modelId: string;
  report: AuditReport | null;
};

export type ClientModel = {
  id: string;
  name: string;
  task: string;
};

export type ClientWorkspace = {
  organisation: { name: string };
  models: ClientModel[];
  audits: ClientAudit[];
};

const [layoutA, layoutB, , layoutD, layoutE] = auditRecords;

const testModels: ClientModel[] = [
  { id: "test-model-a", name: "Test model A", task: "Brain MRI segmentation" },
  { id: "test-model-b", name: "Test model B", task: "Longitudinal atrophy measurement" },
  { id: "test-model-c", name: "Test model C", task: "Multi-site MRI harmonisation" }
];

const testWorkspace: ClientWorkspace = {
  organisation: { name: "Test organisation" },
  models: testModels,
  audits: [
    {
      ...layoutD,
      id: "ta-104",
      modelId: "test-model-a",
      model: "Test model A",
      version: "2.2",
      task: "Brain MRI segmentation",
      report: null
    },
    {
      ...layoutE,
      id: "ta-105",
      modelId: "test-model-c",
      model: "Test model C",
      version: "1.0",
      task: "Multi-site MRI harmonisation",
      report: null
    },
    {
      ...layoutA,
      id: "ta-101",
      modelId: "test-model-a",
      model: "Test model A",
      version: "2.1",
      task: "Brain MRI segmentation",
      report: { fileName: "Audit report – Test model A v2.1.pdf", uploadedOn: "2026-09-15", sizeLabel: "1.8 MB" }
    },
    {
      ...layoutB,
      id: "ta-102",
      modelId: "test-model-b",
      model: "Test model B",
      version: "1.4",
      task: "Longitudinal atrophy measurement",
      report: { fileName: "Audit report – Test model B v1.4.pdf", uploadedOn: "2026-08-02", sizeLabel: "1.2 MB" }
    }
  ]
};

/** The signed-in user's workspace, or null if they have none. */
export function getClientWorkspace(user: AuthUser): ClientWorkspace | null {
  return user.id === "test-user" ? testWorkspace : null;
}
