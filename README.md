# PAMIZE Synapse

**PAMIZE – AI for real business impact**

Private source repository for the PAMIZE Synapse platform: economic intelligence, enterprise transformation and a governed network of digital workers (AI agents).

## Product areas

- **Universal Data Model (UDM):** multi-tenant canonical business data, provenance, validated calculations and diagnostic findings.
- **Agent Registry:** agent definitions, versions, skills, tools, permissions, human supervisors and tenant-specific instances.
- **Agent Orchestrator:** durable tasks, workflow states, delegation, approvals, limits, monitoring and audit.
- **Management Cockpit:** the 18 planned functional modules of Synapse.
- **Economic Diagnostics:** financial, profitability, procurement, production, logistics and organizational analytics.

## Development policy

1. `main` is the production source of truth. All substantial changes are proposed through Pull Requests.
2. Features use `feature/*` branches; fixes use `fix/*` branches. Every deployed release gets a `vMAJOR.MINOR.PATCH` tag.
3. CI checks, review and tests precede merges to `main`; production deployment is performed only after verification.
4. Never commit real client datasets, private credentials, API tokens, passwords or secrets.
5. All automated recommendations preserve the evidence, calculation methodology and human approval history.
6. Vercel deploys the app; it is **not** the primary storage for source code or enterprise business data.

## Status

Bootstrap phase. This repository was created for Synapse on 27 October 2026. A design baseline and the first application shell are being prepared. Business functionality remains subject to implementation and testing.

## Documentation

See `docs/architecture/`, `docs/methodology/` and `docs/decisions/` as they are introduced.

## License

Proprietary. © PAMIZE. All rights reserved.
