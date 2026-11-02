import "server-only";
import {Pool} from "@neondatabase/serverless";
import type {VerifiedPrincipal} from "./assessment-authorization";
import {canAccessRemediation} from "./remediation-audit-ledger";

type WriteInput={
 principal:VerifiedPrincipal|null;tenantId:string;organizationId:string;
 actionId:string;expectedRevision:number;expectedState:string;nextState:string;
 actorId:string;eventId:string;eventHash:string;previousHash:string|null;
 occurredAt:string;
};
/** Prepared but disabled: requires a restricted RLS database role, verified membership,
 * server-generated audit event and hashes, and migration to isolated Preview Neon.
 * Never pass arbitrary client-provided hashes or principal to this function. */
export async function writePreviewRemediation(input:WriteInput):Promise<never>{
 if(!canAccessRemediation(input.principal,input.tenantId,input.organizationId,
   input.nextState==="approved"||input.nextState==="rejected"?"review":"progress"))
  throw Error("Forbidden");
 if(process.env.VERCEL_ENV!=="preview"||
  process.env.VERCEL_GIT_COMMIT_REF!=="feature/compliance-guardian"||
  process.env.COMPLIANCE_ISOLATED_DB_CONFIRMED!=="true")
  throw Error("Preview isolation required");
 // Explicit hard stop until authorization, schema, RLS and audit integration tests pass.
 throw Error("Remediation persistence disabled pending security acceptance");
}
/** Design reference only. The eventual implementation must:
 * BEGIN transaction;
 * SELECT action FOR UPDATE WHERE tenant_id AND organization_id AND id;
 * validate expectedRevision, state, independently verified author/reviewer;
 * UPDATE action SET state, revision=revision+1 WHERE ... AND revision=expectedRevision;
 * INSERT append-only event with per-action monotonic event_number/hash;
 * COMMIT or ROLLBACK together.
 * Do not expose a write route before a privileged server identity
 * and a PostgreSQL RLS role are provisioned and tested.
 */
export type NeonTransactionalDriver=Pick<Pool,"connect">;
