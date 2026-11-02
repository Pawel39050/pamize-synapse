import "server-only";
import {neon} from "@neondatabase/serverless";
import type {VerifiedPrincipal} from "./assessment-authorization";
import {canAccessRemediation} from "./remediation-audit-ledger";

export type RemediationSummaryRow={
 id:string;obligationId:string;priority:"high"|"medium"|"normal";
 state:string;ownerId:string|null;dueDate:string|null;revision:number;
};
/** Read-only Preview adapter; no HTTP route and no customer writes.
 * Requires previously verified Entra identity and server-provisioned membership.
 * The dedicated database login must also be limited by PostgreSQL grants and RLS. */
export async function listPreviewRemediations(input:{
 principal:VerifiedPrincipal|null;tenantId:string;organizationId:string;
}):Promise<RemediationSummaryRow[]>{
 if(!canAccessRemediation(input.principal,input.tenantId,input.organizationId,"read"))
  throw Error("Forbidden");
 if(process.env.VERCEL_ENV!=="preview"||
    process.env.VERCEL_GIT_COMMIT_REF!=="feature/compliance-guardian"||
    process.env.COMPLIANCE_ISOLATED_DB_CONFIRMED!=="true")
  throw Error("Dedicated Preview database required");
 const url=process.env.COMPLIANCE_DATABASE_URL;
 const expected=process.env.COMPLIANCE_EXPECTED_DB_HOST;
 if(!url||!expected)throw Error("Preview database configuration missing");
 const parsed=new URL(url);
 if(!["postgres:","postgresql:"].includes(parsed.protocol)||
    parsed.hostname!==expected||!expected.endsWith(".neon.tech")||
    parsed.searchParams.get("sslmode")==="disable")throw Error("Unapproved Neon host");
 // Schema is currently design-only; without explicit release flag this is inaccessible.
 if(process.env.COMPLIANCE_REMEDIATION_READ_ENABLED!=="true")
  throw Error("Remediation reads are not enabled");
 const sql=neon(url);
 const rows=await sql`SELECT id,obligation_id,priority,state,owner_id,due_date,revision
 FROM public.compliance_remediation_actions
 WHERE tenant_id=${input.tenantId} AND organization_id=${input.organizationId}
 ORDER BY updated_at DESC,id DESC LIMIT 100`;
 return rows.map(row=>({
  id:String(row.id),obligationId:String(row.obligation_id),
  priority:row.priority as RemediationSummaryRow["priority"],
  state:String(row.state),ownerId:row.owner_id==null?null:String(row.owner_id),
  dueDate:row.due_date==null?null:String(row.due_date).slice(0,10),
  revision:Number(row.revision)
 }));
}
