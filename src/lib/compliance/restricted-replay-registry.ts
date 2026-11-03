import type {ReplayRegistry} from "./signed-agent-event-channel.ts";
/** Security boundary for the future restricted Preview DB role.
 * This adapter does not connect to Neon or create an external endpoint.
 * Provided executor MUST perform SQL atomically on a dedicated database connection
 * with RLS tenant / org constraints, and must never use an admin connection. */
export const REPLAY_INSERT_SQL=`
 INSERT INTO public.compliance_agent_event_replay_nonces
 (tenant_id, organization_id, agent_key, nonce, expires_at)
 VALUES ($1,$2,$3,$4,to_timestamp($5 / 1000.0))
 ON CONFLICT (tenant_id,organization_id,agent_key,nonce) DO NOTHING
 RETURNING nonce
`.trim();
export type RestrictedReplayExecutor={
 insertOnce:(sql:string,params:readonly [string,string,string,string,number])=>Promise<{rows:readonly {nonce:string}[]}>;
};
const valid=/^[A-Za-z0-9_-]{3,100}$/;
const validNonce=/^[A-Za-z0-9_-]{20,100}$/;
export function makeRestrictedReplayRegistry(executor:RestrictedReplayExecutor):ReplayRegistry{
 if(!executor||typeof executor.insertOnce!=="function")throw Error("Restricted replay executor required");
 return {async reserveOnce(scope,nonce,expiresAt){
  const parts=scope.split(":");
  if(parts.length!==3||!parts.every(x=>valid.test(x))||
   parts[2]!=="AG-PRC-001"||!validNonce.test(nonce)||
   !Number.isSafeInteger(expiresAt)||expiresAt<=Date.now())throw Error("Invalid replay reservation");
  const rows=(await executor.insertOnce(REPLAY_INSERT_SQL,[parts[0],parts[1],parts[2],nonce,expiresAt])).rows;
  if(rows.length>1||rows.some(r=>r.nonce!==nonce))throw Error("Unexpected database response");
  return rows.length===1;
 }};
}
