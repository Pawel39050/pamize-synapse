/** Fail-closed preflight for the restricted database role used by agent event ingestion.
 * Must be evaluated using an independently authenticated Preview database connection,
 * not untrusted request headers. Does NOT grant access or provision roles.
 */
export type DatabaseRoleFacts={
 roleName:string;
 canLogin:boolean;
 bypassRls:boolean;
 superuser:boolean;
 canCreateRole:boolean;
 canCreateDb:boolean;
 rlsEnabled:boolean;
 rlsForced:boolean;
};
export const RESTRICTED_AGENT_ROLE_PREFLIGHT_SQL=`
SELECT r.rolname AS "roleName",
       r.rolcanlogin AS "canLogin",
       r.rolbypassrls AS "bypassRls",
       r.rolsuper AS "superuser",
       r.rolcreaterole AS "canCreateRole",
       r.rolcreatedb AS "canCreateDb",
       c.relrowsecurity AS "rlsEnabled",
       c.relforcerowsecurity AS "rlsForced"
FROM pg_roles r
JOIN pg_class c ON c.oid = 'public.compliance_agent_event_replay_nonces'::regclass
WHERE r.rolname = $1
`.trim();
export function assertSafeAgentReplayRole(
 facts:DatabaseRoleFacts|null,
 expectedRoleName:string
):void{
 if(!facts||!expectedRoleName||facts.roleName!==expectedRoleName||
  facts.bypassRls!==false||facts.superuser!==false||
  facts.canCreateRole!==false||facts.canCreateDb!==false||
  facts.canLogin!==false||facts.rlsEnabled!==true||facts.rlsForced!==true){
  throw Error("Agent replay database role security preflight failed");
 }
}
/** This is a non-login, SET ROLE test guard. A future direct-connection role
 * requires a separate policy and credential-isolation security review. */
