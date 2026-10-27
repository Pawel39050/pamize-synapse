# Agent Registry & Orchestrator — design specification v0.1

**Design status: not implemented.** UI labels must clearly say demo, planned or operational.

## Registry data contracts
- `agent_definitions`: key, display_name, family, parent_key, purpose, input/output schema, owner, status.
- `agent_versions`: immutable prompt/config version, model/provider, skill versions, quality evaluation results.
- `skills`: deterministic calculation capability or agentic reasoning capability, declared schemas.
- `tools`: approved endpoint/interface, permitted methods, data classification, side effect level.
- `agent_skill_grants`, `agent_tool_grants`: versioned allowlists.
- `agent_instances`: tenant_id, deployment environment, active version, supervisor, autonomy level A0–A3, limits.

## Initial agents
1. AG-CORE-001 Enterprise Diagnostic Coordinator — delegates, assembles and escalates.
2. AG-ORG-001 Discovery Agent — adaptive organization interview and hypothesis synthesis.
3. AG-FIN-002 Profitability Agent — customer/product/order profitability and scenarios.
4. AG-FIN-001 Financial Intelligence Agent — working capital and liquidity.
5. SYS-DIAG-001 Diagnostic Calculation Engine — **deterministic service, not an LLM worker**.

## Orchestrator entities
- `workflow_definitions`: version, steps/dependencies, budgets, permissions and compensation logic.
- `workflow_runs`: tenant, initiator, status, policy version, timestamps.
- `tasks`: assigned agent instance, state, dependencies, idempotency key, input pointer, cost/time budget.
- `task_events`: append-only state transition events, errors, tool calls and retries.
- `approvals`: approver role, action scope, expiring decision and rationale.
- `tool_executions`: authorization checks, input hash, result reference, token/currency cost.
- `evidence_links`, `diagnostic_findings` and `benefit_measurements` from UDM.

## Task states
`QUEUED → RUNNING → (WAITING_FOR_INPUT | WAITING_FOR_APPROVAL | COMPLETED | FAILED | CANCELED)`.
Retries require deduplication and bounded attempts; critical external side effects require explicit idempotency.

## Trust model
- Tenant segregation in storage, tool calls, search, document retrieval and agent memory.
- Agent instructions cannot grant privileges or authorize themselves.
- All external communications, ERP updates, commercial decisions and plant actions default to A2 human approval.
- Token/tool/time quotas, human kill-switch, traced model/tool versions and redacted logs.
- External data, emails, documents and retrieval chunks are untrusted; mitigate prompt injection.

## First functional scenario
1. PAMIZE manager selects tenant, period and goal: customer/product profitability.
2. Coordinator checks data quality and creates two independent tasks.
3. Profitability Agent requests deterministic contribution margin calculation.
4. Financial Agent calculates working capital and financing effects.
5. Coordinator reconciles common costs, evidence, assumptions and overlapping benefits.
6. Human manager reviews, approves or requests re-analysis.
7. Result saved as `diagnostic_finding` and optional `improvement_initiative`.

## Acceptance
No tenant leakage, documented reproducibility, approval gating, resilience to one failed task, quantified token/tool budget, no phantom realized savings.
