import type {VerifiedPrincipal} from "./assessment-authorization.ts";
import type {RemediationLedger} from "./remediation-audit-ledger.ts";
import type {RemediationCommand} from "./remediation-application-service.ts";
import {executeRemediationCommand,readAuthorizedRemediation} from "./remediation-application-service.ts";

export type ScopedRemediationStore={
 load(input:{tenantId:string;organizationId:string}):Promise<{ledger:RemediationLedger;revision:number}>;
 commit(input:{tenantId:string;organizationId:string;expectedRevision:number;ledger:RemediationLedger}):Promise<boolean>;
};
export type RemediationScope={tenantId:string;organizationId:string};
/** No HTTP routes or database connections. The caller must create a verified principal
 * and look up organizational membership using trusted server-side information. */
export async function runScopedRemediation(args:{
 store:ScopedRemediationStore;principal:VerifiedPrincipal|null;scope:RemediationScope;
 command:RemediationCommand;at:string
}):Promise<RemediationLedger>{
 const {store,principal,scope}=args;
 if(!principal||principal.tenantId!==scope.tenantId||
    !principal.organizationIds.includes(scope.organizationId))throw Error("Forbidden");
 const snapshot=await store.load(scope);
 if(snapshot.ledger.tenantId!==scope.tenantId||
    snapshot.ledger.organizationId!==scope.organizationId||
    !Number.isSafeInteger(snapshot.revision)||snapshot.revision<0)
   throw Error("Invalid scoped repository response");
 const updated=executeRemediationCommand({
  ledger:snapshot.ledger,principal,command:args.command,at:args.at
 });
 const committed=await store.commit({...scope,expectedRevision:snapshot.revision,ledger:updated});
 if(!committed)throw Error("Concurrent revision conflict");
 return updated;
}
export async function readScopedRemediation(args:{
 store:ScopedRemediationStore;principal:VerifiedPrincipal|null;scope:RemediationScope
}):Promise<RemediationLedger>{
 const {store,principal,scope}=args;
 if(!principal||principal.tenantId!==scope.tenantId||
    !principal.organizationIds.includes(scope.organizationId))throw Error("Forbidden");
 const snapshot=await store.load(scope);
 if(snapshot.ledger.tenantId!==scope.tenantId||
    snapshot.ledger.organizationId!==scope.organizationId)throw Error("Invalid scoped repository response");
 return readAuthorizedRemediation({ledger:snapshot.ledger,principal});
}
