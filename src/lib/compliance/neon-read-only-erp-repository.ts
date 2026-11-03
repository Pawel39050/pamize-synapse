import type {EvidenceReadOnlyRepository,EvidenceReadScope} from "./read-only-erp-evidence-adapter.ts";
import type {SourceReceipt} from "./independent-procurement-evidence.ts";
import {assertSafeAgentReplayRole,type DatabaseRoleFacts} from "./agent-replay-role-preflight.ts";

/** Read-only Neon ERP evidence adapter. The caller MUST supply an independently
 * verified scoped database executor. This module never creates a connection,
 * receives a connection string, accepts an arbitrary SQL statement or exposes an API.
 * A role preflight checks a deliberately restricted NOLOGIN test role; actual
 * connection identity and the SET LOCAL ROLE transaction MUST be enforced by the
 * caller and independently security-reviewed before any real-world usage.
 */
export const ERP_EVIDENCE_READ_SQL=`
SELECT event_id AS "eventId",run_id AS "runId",event_kind AS "kind",
 actor_id AS "actorId",evidence_ref AS "evidenceRef",
 source_system_id AS "sourceSystemId",receipt_status AS "status",
 source_record_id AS "sourceRecordId"
FROM public.compliance_synthetic_erp_receipts
WHERE tenant_id=$1 AND organization_id=$2 AND source_system_id=$3
 AND run_id=$4 AND evidence_ref=ANY($5::text[])
ORDER BY event_id,source_record_id
LIMIT 101
`.trim();
type Row=SourceReceipt;
export type ScopedErpReadExecutor={
 readonly verifiedRole:"compliance_agent_replay_rls_probe";
 read:(sql:string,params:readonly [string,string,string,string,readonly string[]])=>Promise<{rows:readonly Row[]}>;
 facts:()=>Promise<DatabaseRoleFacts|null>;
};
const ident=/^[A-Za-z0-9_-]{3,80}$/;
const refPattern=/^[A-Za-z0-9_:/.-]{3,120}$/;
export function makeNeonReadOnlyErpRepository(executor:ScopedErpReadExecutor):EvidenceReadOnlyRepository{
 if(!executor||executor.verifiedRole!=="compliance_agent_replay_rls_probe"||
  typeof executor.read!=="function"||typeof executor.facts!=="function")
  throw Error("Restricted ERP executor required");
 return {async findEvidence(scope:EvidenceReadScope,refs:readonly string[]){
  if(!scope||![scope.tenantId,scope.organizationId,scope.sourceSystemId,scope.runId].every(
    x=>typeof x==="string"&&ident.test(x))||
   !Array.isArray(refs)||refs.length>100||
   refs.some(x=>typeof x!=="string"||!refPattern.test(x)))
   throw Error("Invalid ERP read scope");
  assertSafeAgentReplayRole(await executor.facts(),executor.verifiedRole);
  if(refs.length===0)return [];
  const response=await executor.read(ERP_EVIDENCE_READ_SQL,
   [scope.tenantId,scope.organizationId,scope.sourceSystemId,scope.runId,refs]);
  if(!response||!Array.isArray(response.rows)||response.rows.length>100)
   throw Error("Invalid ERP query response");
  for(const row of response.rows){
   if(!row||row.runId!==scope.runId||row.sourceSystemId!==scope.sourceSystemId||
    !refs.includes(row.evidenceRef))throw Error("ERP returned out-of-scope receipt");
  }
  return response.rows.map(r=>({...r}));
 }};
}
