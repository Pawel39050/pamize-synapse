/** Synapse data contracts (design only: no database or external systems connected). */
export type UUID = string;
export type ISODateTime = string;
export type AutonomyLevel = "A0" | "A1" | "A2" | "A3";
export type AgentLifecycle = "planned" | "testing" | "active" | "suspended";

export interface TenantScoped {
  id: UUID;
  tenantId: UUID;
  createdAt: ISODateTime;
}

export interface DataProvenance {
  sourceSystemId: UUID;
  sourceRecordId: string;
  importBatchId: UUID;
  extractedAt: ISODateTime;
  quality: "unverified" | "validated" | "rejected";
}

export interface FinancialAmount {
  value: string; // decimal string: never calculate currency with JS floating point
  currency: string; // ISO 4217
}

export interface CanonicalSalesInvoiceLine extends TenantScoped {
  invoiceId: UUID;
  customerId: UUID;
  productId: UUID;
  saleDate: string;
  quantity: string;
  netAmount: FinancialAmount;
  provenance: DataProvenance;
}

export interface DiagnosticFinding extends TenantScoped {
  diagnosticRunId: UUID;
  title: string;
  status: "hypothesis" | "validated" | "approved" | "implementing" | "measured";
  evidenceRefs: string[];
  calculationVersion?: string;
  assumptions: string[];
  annualizedPotential?: FinancialAmount;
  verifiedRealized?: FinancialAmount;
  approvedBy?: UUID;
}

export interface AgentDefinition {
  key: string;
  version: string;
  name: string;
  family: string;
  purpose: string;
  skillKeys: string[];
  toolKeys: string[];
  lifecycle: AgentLifecycle;
}

export interface AgentInstance extends TenantScoped {
  definitionKey: string;
  definitionVersion: string;
  supervisorUserId: UUID;
  autonomy: AutonomyLevel;
  toolAllowlist: string[];
  monthlyCostLimit: FinancialAmount;
}

export type TaskState =
  | "queued"
  | "running"
  | "waiting_for_input"
  | "waiting_for_approval"
  | "completed"
  | "failed"
  | "canceled";

export interface TaskContract extends TenantScoped {
  workflowRunId: UUID;
  requestedBy: UUID;
  assignedAgentInstanceId: UUID;
  objective: string;
  inputRefs: string[];
  dependencyTaskIds: UUID[];
  idempotencyKey: string;
  state: TaskState;
  autonomy: AutonomyLevel;
  costLimit: FinancialAmount;
  requiresHumanApproval: boolean;
  approvedBy?: UUID;
}

const allowedTransitions: Record<TaskState, TaskState[]> = {
  queued: ["running", "canceled"],
  running: ["waiting_for_input", "waiting_for_approval", "completed", "failed", "canceled"],
  waiting_for_input: ["queued", "canceled"],
  waiting_for_approval: ["queued", "canceled"],
  completed: [],
  failed: ["queued", "canceled"],
  canceled: []
};

/** Checks a proposed transition; does not persist or execute the task. */
export function canTransition(from: TaskState, to: TaskState): boolean {
  return allowedTransitions[from].includes(to);
}

/** Defense in depth; database row-level security is still required. */
export function assertSameTenant(subjectTenantId: UUID, resourceTenantId: UUID): void {
  if (!subjectTenantId || !resourceTenantId || subjectTenantId !== resourceTenantId) {
    throw new Error("Tenant access denied");
  }
}

/** A2/A3 are not implicitly authorized; these are just suggested autonomy labels. */
export function isReadOrRecommendOnly(level: AutonomyLevel): boolean {
  return level === "A0" || level === "A1";
}
