# Compliance Guardian — scheduling contract (Preview only)

Endpoint: `POST /api/compliance/monitor` on the **feature/compliance-guardian** Vercel Preview deployment.

Requirements for an external job scheduler:
- Run daily at 06:00 Europe/Warsaw (timezone-aware scheduler; daylight-saving aware).
- POST with header `x-compliance-diagnostic-token` using a secret stored only in the scheduler vault (never in code/logs).
- Use ONLY a stable Preview branch alias, never a production domain.
- Accept only HTTP 200 + `status` in `baseline|unchanged|website-content-changed`.
- Alert on non-200, failed invocations, or persistent missing successful runs.
- Do not retry concurrently; employ single-flight/locking upstream.
- Scope the job to this one UODO source until source-specific policies are reviewed.
- A website-content-changed result is **not** proof of an amended legal act.

Safety:
- The route returns 404 outside Preview / feature branch; 401 without a token; 503 while either storage flag is false.
- The database layer also validates VERCEL_ENV, VERCEL_GIT_COMMIT_REF and the approved Neon host.
- Enabling COMPLIANCE_STORAGE_ENABLED and COMPLIANCE_ISOLATED_DB_CONFIRMED on dedicated Preview is a separate reviewed action.
- No production Cron configuration should be added. Vercel Cron is deployed against Production.
- No scheduler has been activated merely by committing the route.

Deployment readiness and one authenticated invocation must be verified before enabling recurrence.
