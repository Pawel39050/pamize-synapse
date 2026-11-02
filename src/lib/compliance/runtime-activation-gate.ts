/** Distinguishes safe locked Preview setup from a genuinely usable runtime.
 * No login credentials or organization records are created here. */
export function assessRuntimeActivation(input:{
 role:{name:string;canLogin:boolean;bypassRls:boolean;superuser:boolean;createDb:boolean;createRole:boolean;inheritsNeonSuperuser:boolean}|null;
 restrictedRls:boolean;membershipVerified:boolean;transactionIsolationTested:boolean;
 runtimeCanReadScopedData:boolean;
}){
 const blockers:string[]=[];
 const r=input.role;
 if(!r||r.name!=="compliance_runtime_login_preview")blockers.push("Missing verified runtime login role");
 else {
  if(!r.canLogin)blockers.push("Runtime role has NOLOGIN");
  if(r.bypassRls||r.superuser||r.createDb||r.createRole||r.inheritsNeonSuperuser)
   blockers.push("Runtime role has elevated privileges");
 }
 if(!input.runtimeCanReadScopedData)blockers.push("Runtime role lacks verified least-privilege SELECT access");
 if(!input.restrictedRls)blockers.push("Row security not independently verified");
 if(!input.membershipVerified)blockers.push("Organization membership not verified");
 if(!input.transactionIsolationTested)blockers.push("Real database isolation test not passed");
 return {ready:blockers.length===0,blockers};
}
