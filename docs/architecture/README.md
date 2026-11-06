# PAMIZE Synapse — architecture baseline v0.1

## Decisions
- One private Git repository is the source of truth. Changes flow through feature branches and reviewed Pull Requests.
- `apps/web`: Next.js management cockpit (18 module routes, intentionally not presented as live services).
- `packages/data-model`: canonical, tenant-scoped records and source evidence.
- `packages/agent-registry`: versioned digital worker definitions, tool grants, per-tenant agent instances.
- `packages/orchestrator`: durable task contracts, dependency tracking, approvals, audit events.
- `packages/diagnostics`: deterministic economic calculations, diagnostic rules, scenario methodology.
- Backend, database, auth, provider model service and integrations are **not yet implemented**.

## Non-negotiable invariants
1. Every client row, task, finding, evidence pointer and agent instance has `tenant_id`.
2. Each agent tool call is authorized by a server-side policy; prompts and UI are not policy boundaries.
3. Calculation results include formula_version, unit, period, source references and quality flags.
4. Findings can have states HYPOTHESIS → VALIDATED → APPROVED → IMPLEMENTING → MEASURED.
5. Realized benefit differs from operational capacity and forecasted savings; avoid double counting.
6. Mutating ERP/CRM/MES/WMS, sending emails or voice calls require explicit approval until per-action limited autonomy is proven.
7. Never put credentials or real customer records in the repository, client-side bundle, logs or LLM prompts without minimization.

## Component boundaries
- Browser: navigation and management views. Never hold client secrets or direct access to enterprise databases.
- API backend: tenancy/auth, signed data access, canonical import, registry validation and workflow authorization.
- Durable workflow service: persisted task execution and state transitions, retries with idempotency keys, cost/time budgets.
- Calculation engine: source-grounded deterministic financial/operational computations.
- AI services: interview, interpretation, discrepancy review, executive recommendations. Not the authoritative arithmetic.

## Build order
1. Real auth + tenancy + migration tooling before real client data.
2. Data import, provenance, reconciliation and profitability engine.
3. Registry of four initial agents and their tool grants.
4. Durable task orchestration, approval UI and audit trail.
5. Synthetic end-to-end pilot, CFO reconcilability and independent security review.

## Acceptance gates
- Unit tests and build pass in CI.
- Tenant A cannot read/change tenant B data, including search and task results.
- False or incomplete source data yields validation error, not fabricated precision.
- Workflow is resumable and never double executes financial mutations.
- Every numerical executive claim links to auditable calculations and evidence.
