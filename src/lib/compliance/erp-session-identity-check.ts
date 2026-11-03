/** Read-only ERP sessions must use a dedicated low-privilege login, not SET ROLE from an administrator. */
export type ErpSessionIdentity = {
 currentUser:string; sessionUser:string;
 sessionCanLogin:boolean; sessionBypassRls:boolean; sessionSuperuser:boolean;
 sessionCreateRole:boolean; sessionCreateDb:boolean;
 activeBypassRls:boolean; rlsEnabled:boolean; rlsForced:boolean;
 canRead:boolean; canInsert:boolean; canUpdate:boolean; canDelete:boolean;
};
export function assertDedicatedErpReadOnlySession(facts:ErpSessionIdentity|null,role:string):void{
 if(!facts||!role||facts.currentUser!==role||facts.sessionUser!==role||
  !facts.sessionCanLogin||facts.sessionBypassRls||facts.sessionSuperuser||
  facts.sessionCreateRole||facts.sessionCreateDb||facts.activeBypassRls||
  !facts.rlsEnabled||!facts.rlsForced||!facts.canRead||
  facts.canInsert||facts.canUpdate||facts.canDelete)
  throw Error("ERP session identity cannot be trusted");
}
