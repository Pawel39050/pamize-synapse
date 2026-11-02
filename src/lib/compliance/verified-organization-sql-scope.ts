import type {VerifiedPrincipal} from "./assessment-authorization.ts";
import type {TrustedMembershipDirectory} from "./organization-membership.ts";
import {resolveScopedOrganizationPrincipal} from "./scoped-organization-principal.ts";
export type ScopedSqlConnection={
 query(sql:string,params:readonly unknown[]):Promise<{rows:Record<string,unknown>[];rowCount:number|null}>;
 release():void;
};
export type ScopedSqlProvider={connect():Promise<ScopedSqlConnection>};
/** A verified identity and separately provisioned membership MUST precede any SQL connection.
 * PostgreSQL custom GUCs are user-settable; RLS is defense-in-depth, not identity proof.
 * The provider MUST enforce an independently verified least-privilege database role. */
export async function withVerifiedOrganizationScope<T>(input:{
 identity:VerifiedPrincipal;organizationId:string;
 directory:TrustedMembershipDirectory;provider:ScopedSqlProvider;
 work:(connection:ScopedSqlConnection)=>Promise<T>
}):Promise<T>{
 const verified=await resolveScopedOrganizationPrincipal({identity:input.identity,organizationId:input.organizationId,directory:input.directory});
 if(!input.organizationId.trim()||!verified.organizationIds.includes(input.organizationId))
   throw Error("Organization access forbidden");
 const connection=await input.provider.connect();
 let began=false;
 try{
  await connection.query("BEGIN",[]);began=true;
  // SET LOCAL via set_config only lasts for this transaction, never leaks to pooled connections.
  await connection.query("SELECT set_config('app.compliance_tenant_id',$1,true)",[verified.tenantId]);
  await connection.query("SELECT set_config('app.compliance_organization_id',$1,true)",[input.organizationId]);
  await connection.query("SELECT set_config('app.compliance_subject_id',$1,true)",[verified.subject]);
  const result=await input.work(connection);
  await connection.query("COMMIT",[]);began=false;
  return result;
 }catch(e){
  if(began)await connection.query("ROLLBACK",[]).catch(()=>{});
  throw e;
 }finally{connection.release();}
}
