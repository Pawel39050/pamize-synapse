# Stage 4 — Entra ID configuration gate (Preview only)

Status: PREPARED; NOT CONNECTED. No actual Microsoft Entra app registration has been created by ChatGPT.

## Microsoft Entra admin action (requires tenant administrator)
1. Microsoft Entra admin center → App registrations → New registration.
2. Name: PAMIZE Synapse Compliance Guardian Preview.
3. Supported account types: Accounts in this organizational directory only (single tenant).
4. Register an application for the protected backend API. Record **Directory (tenant) ID** and **Application (client) ID** (not secret).
5. Expose an API and define delegated access scopes if needed; configure a separate browser client / redirect URI only after the login architecture is finalized.
6. Define and administer application roles (author, reviewer, viewer), map them to server-side policy and organization membership; never trust a user-supplied tenant ID or role.
7. Configure verified organization membership from trusted storage, server-side session issuance, CSRF and callback handling, rotation/revocation strategy and audit logs before enabling login.

## Preview configuration to add only after app registration
- ENTRA_TENANT_ID: directory tenant UUID.
- ENTRA_API_CLIENT_ID: API application/client identifier UUID.
- These must be restricted to Vercel Preview branch `feature/compliance-guardian`; no production keys.
- Never place client secrets in NEXT_PUBLIC_* env vars. No secret needed to verify a signed access token.
- Token verifier in `src/lib/compliance/entra-token-verifier.ts` remains unexposed until tested against real Microsoft signed access tokens.
- Role and membership resolution MUST be server-side; a type annotation is not a trust boundary.
- Validate signature and issuer against actual Entra metadata for the configured audience and token version prior to enabling; add negative tests for key rollover, wrong audience, expired tokens and tenant mixing.

## Release gates
- No unrestricted public API to Neon.
- No persistent personal/customer information until authenticated principal, tenant isolation/RLS, authorization, audit trail and access revocation have been tested.
- Existing Compliance Guardian demo remains local-only.
