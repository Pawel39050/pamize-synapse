# Synapse v0.1 application shell — implementation notes

## Implemented on feature branch
- Next.js App Router with responsive layout and navigation to exactly 18 modules.
- Overview cockpit with explicit counts and *zero* simulated live integrations.
- Client/Data module displays proposed Universal Data Model pipeline.
- Agent Registry presents five initial **definitions only**; does not create tenant agent instances.
- Orchestrator provides client-side, click-through workflow **simulation**; does not trigger tools.
- Shared TypeScript data, evidence, agent and task contracts, including transition and tenant guard utilities.
- `/api/health` indicates demonstration mode and no production backend.
- GitHub Actions CI workflow for installing, typechecking and building.

## Not implemented
- Database/PostgreSQL, migrations, enterprise-grade RLS/tenant isolation, real authentication.
- ERP/CRM/MES imports and quality reconciliation, actual calculators, LLM agents or orchestration.
- Persistent workflow state, queues, approval APIs, per-tenant authorization or audit logs.
- Outlook, home.pl, voice, billing and Microsoft 365 integration.

## Non-negotiable launch boundary
This app is only a visual architecture proof-of-concept. Do **not** ingest personal or commercial client data into this branch or expose it as a production agent platform. Authentication, persisted workflow, enforceable tenant access and audit are prerequisites.

## Repository layout
The Next.js app currently occupies the root for simple Vercel integration. Future independent services or shared packages may be extracted into `apps/web` and `packages/*` once justified, preserving compatibility through tested refactors. Do not create placeholder package directories with no actual code.

## Verification
Run:
```bash
npm install
npm run typecheck
npm run build
npm run dev
```
Review the 18 routes and demo interactions in a browser. CI is configured but build status must be verified before merge. A lockfile should be committed after dependency resolution; switch CI to `npm ci` for deterministic installs.

## Planned next increments
1. Repository checks, lockfile and hosted Preview deployment.
2. Tenant and user authentication, PostgreSQL schema and row-level security.
3. Ingestion/provenance and deterministic profitability calculations.
4. Persistent Agent Registry and task orchestration with authorization checks.
5. Full synthetic diagnostic pilot and executive approval workflow.
