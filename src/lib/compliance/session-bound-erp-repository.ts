import type {EvidenceReadOnlyRepository,EvidenceReadScope} from "./read-only-erp-evidence-adapter.ts";
import type {SourceReceipt} from "./independent-procurement-evidence.ts";
import {assertDedicatedErpReadOnlySession,type ErpSessionIdentity} from "./erp-session-identity-check.ts";
import {ERP_EVIDENCE_READ_SQL} from "./neon-read-only-erp-repository.ts";

/**
 * Session-bound, fail-closed ERP evidence reader for the isolated Preview.
 *
 * The injected transaction implementation MUST use ONE dedicated PostgreSQL
 * connection authenticated as the specified nonprivileged login. The callback,
 * identity probe and SELECT must run on that very same connection and transaction.
 * A pool that multiplexes these operations between clients is NOT compatible.
 *
 * This adapter cannot create or authenticate a database connection and does not
 * establish ERP-origin authenticity. It exposes no credentials or public endpoint.
 */
export const ERP_SESSION_PROBE_SQL=`
SELECT current_user AS "currentUser", session_user AS "sessionUser",
 session.rolcanlogin AS "sessionCanLogin",
 session.rolbypassrls AS "sessionBypassRls",
 session.rolsuper AS "sessionSuperuser",
 session.rolcreaterole AS "sessionCreateRole",
 session.rolcreatedb AS "sessionCreateDb",
 active.rolbypassrls AS "activeBypassRls",
 table_meta.relrowsecurity AS "rlsEnabled",
 table_meta.relforcerowsecurity AS "rlsForced",
 has_table_privilege(session_user,table_meta.oid,'SELECT') AS "canRead",
 has_table_privilege(session_user,table_meta.oid,'INSERT') AS "canInsert",
 has_table_privilege(session_user,table_meta.oid,'UPDATE') AS "canUpdate",
 has_table_privilege(session_user,table_meta.oid,'DELETE') AS "canDelete"
FROM pg_roles session
JOIN pg_roles active ON active.rolname=current_user
JOIN pg_class table_meta ON table_meta.oid='public.compliance_synthetic_erp_receipts'::regclass
WHERE session.rolname=session_user
`.trim();

type ReadParams=readonly [string,string,string,string,readonly string[]];
type SqlReader={
 identity:(sql:typeof ERP_SESSION_PROBE_SQL)=>Promise<ErpSessionIdentity|null>;
 select:(sql:typeof ERP_EVIDENCE_READ_SQL,params:ReadParams)=>Promise<{rows:readonly SourceReceipt[]}>;
};
export type DedicatedErpSessionProvider={
 readonly expectedLoginRole:"compliance_erp_reader_preview";
 withReadOnlySession:<T>(read:(session:SqlReader)=>Promise<T>)=>Promise<T>;
};
const namePattern=/^[A-Za-z0-9_-]{3,80}$/;
const referencePattern=/^[A-Za-z0-9_:/.-]{3,120}$/;
export function makeSessionBoundErpRepository(
 provider:DedicatedErpSessionProvider
):EvidenceReadOnlyRepository{
 if(!provider||provider.expectedLoginRole!=="compliance_erp_reader_preview"||
  typeof provider.withReadOnlySession!=="function")
  throw Error("Dedicated ERP session provider required");
 return {
  async findEvidence(scope:EvidenceReadScope,refs:readonly string[]):Promise<readonly SourceReceipt[]>{
   if(!scope||![scope.tenantId,scope.organizationId,scope.sourceSystemId,scope.runId]
      .every(x=>typeof x==="string"&&namePattern.test(x))||
    !Array.isArray(refs)||refs.length>100||
    refs.some(x=>typeof x!=="string"||!referencePattern.test(x)))
    throw Error("Invalid ERP evidence read scope");
   return provider.withReadOnlySession(async session=>{
    if(!session||typeof session.identity!=="function"||typeof session.select!=="function")
     throw Error("ERP read session unavailable");
    const identity=await session.identity(ERP_SESSION_PROBE_SQL);
    assertDedicatedErpReadOnlySession(identity,provider.expectedLoginRole);
    if(refs.length===0)return [];
    const result=await session.select(ERP_EVIDENCE_READ_SQL,[
     scope.tenantId,scope.organizationId,scope.sourceSystemId,scope.runId,refs
    ]);
    if(!result||!Array.isArray(result.rows)||result.rows.length>100)
     throw Error("Invalid ERP evidence response");
    for(const r of result.rows){
     if(!r||r.runId!==scope.runId||r.sourceSystemId!==scope.sourceSystemId||
      !refs.includes(r.evidenceRef))
      throw Error("ERP evidence scope mismatch");
    }
    return result.rows.map(r=>({...r}));
   });
  }
 };
}
