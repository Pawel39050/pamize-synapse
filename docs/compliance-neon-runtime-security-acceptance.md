# Compliance Guardian — Neon runtime role acceptance gate

Target only: project sweet-bonus-78223279, Preview branch br-bitter-pond-b97srhrd. Never use production credentials.

## Blocking observation (2026-11-02)
Neon API `create_postgres_role` automatically granted membership in `neon_superuser`; its newly created role had `rolbypassrls=true`, `rolcreatedb=true`, `rolcreaterole=true`. Database owner could not `ALTER ROLE` to remove privileges. The unsafe role was deleted and confirmed absent.

## Before enabling any data endpoints
1. Ask Neon administration/support how to provision a genuine login with `rolbypassrls=false`, `rolsuper=false`, `rolcreatedb=false`, `rolcreaterole=false` and no inherited `neon_superuser`. Do not use standard API role creation without verifying privileges.
2. Verify new role grants, membership and RLS enforcement with SQL below, using the actual runtime role connection:
   ```sql
   SELECT current_user, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole
   FROM pg_roles WHERE rolname = current_user;
   SELECT granted.rolname
   FROM pg_auth_members m JOIN pg_roles member ON member.oid=m.member
   JOIN pg_roles granted ON granted.oid=m.roleid
   WHERE member.rolname=current_user;
   SELECT relname, relrowsecurity, relforcerowsecurity
   FROM pg_class WHERE relname IN ('compliance_remediation_actions','compliance_remediation_events','compliance_organization_memberships');
   ```
3. Test cross-tenant reads, cross-tenant writes, revoked membership, missing context, attempts to alter RLS, audit UPDATE/DELETE and transactional rollback. All forbidden cases must fail.
4. Only then provision environment variables and enable guarded endpoints, after user acceptance.

No application runtime DB grants or RLS policies should be added until a non-bypass role is available. No live write route exists in this phase.
