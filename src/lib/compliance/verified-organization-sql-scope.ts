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
  const roleCheck=await connection.query(
   "SELECT r.rolname,r.rolsuper,r.rolbypassrls,r.rolcreatedb,r.rolcreaterole, EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles granted ON granted.oid=m.roleid WHERE m.member=r.oid AND granted.rolname='neon_superuser') AS neon_superuser_member FROM pg_roles r WHERE r.rolname=current_user",[]);
  const role=roleCheck.rows[0];
  if(roleCheck.rows.length!==1||role.rolname!=="compliance_runtime_login_preview"||
     role.rolsuper!==false||role.rolbypassrls!==false||
     role.rolcreatedb!==false||role.rolcreaterole!==false||
     role.neon_superuser_member!==false)
    throw Error("Unsafe database runtime identity");
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
