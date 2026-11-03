import {Pool} from "@neondatabase/serverless";
import type {DedicatedErpSessionProvider} from "./session-bound-erp-repository.ts";
import type {ErpSessionIdentity} from "./erp-session-identity-check.ts";
import type {SourceReceipt} from "./independent-procurement-evidence.ts";

/** Preview-only session provider; never automatically activated.
 * Credentials are injected through server-side configuration only.
 * No browser usage, public endpoint, migration or background connection.
 */
export type ErpSqlClient={
 query:(sql:string,params?:readonly unknown[])=>Promise<{rows:unknown[]}>;
 release:()=>void;
};
export type ErpSqlPool={
 connect:()=>Promise<ErpSqlClient>;
 end:()=>Promise<void>;
};
const role="compliance_erp_reader_preview";
export function validateErpPreviewConnectionString(
 connectionString:string,expectedHost:string,forbiddenHost:string
):void{
 let url:URL;
 try{url=new URL(connectionString)}catch{throw Error("Invalid ERP database connection configuration")}
 if(!["postgres:","postgresql:"].includes(url.protocol)||
  !url.hostname.endsWith(".neon.tech")||
  url.hostname!==expectedHost||url.hostname===forbiddenHost||
  !expectedHost||!forbiddenHost||expectedHost===forbiddenHost||
  decodeURIComponent(url.username)!==role||
  !url.password||url.searchParams.get("sslmode")!=="require")
  throw Error("ERP database connection security configuration failed");
}
/** The caller owns the pool. This permits tests to supply an in-memory mock.
 * A real Pool must connect as the dedicated low-privilege ERP role.
 */
export function makePgErpSessionProvider(pool:ErpSqlPool):DedicatedErpSessionProvider{
 if(!pool||typeof pool.connect!=="function")throw Error("ERP pool unavailable");
 return {expectedLoginRole:role,
  async withReadOnlySession<T>(run:(session:{
   identity:(sql:string)=>Promise<ErpSessionIdentity|null>;
   select:(sql:string,params:readonly [string,string,string,string,readonly string[]])=>Promise<{rows:readonly SourceReceipt[]}>;
  })=>Promise<T>):Promise<T>{
   const client=await pool.connect();
   let inTransaction=false;
   try{
    await client.query("BEGIN TRANSACTION READ ONLY");
    inTransaction=true;
    const result=await run({
     identity:async sql=>{
      const result=await client.query(sql);
      return (result.rows[0]??null) as ErpSessionIdentity|null;
     },
     select:async(sql,params)=>{
      const result=await client.query(sql,params);
      return {rows:result.rows as SourceReceipt[]};
     }
    });
    await client.query("COMMIT");
    inTransaction=false;
    return result;
   }catch(error){
    if(inTransaction){try{await client.query("ROLLBACK")}catch{/* retain original error */}}
    throw error;
   }finally{client.release()}
  }
 };
}
/** Do not enable without explicit secure Preview config and an ERP password
 * stored as a server-only secret, never in source control.
 * Never pass an admin Neon URL, even when SET ROLE is used elsewhere.
 */
export function createPreviewErpPoolFromServerConfig(config:{
 connectionString:string;expectedHost:string;forbiddenHost:string;
}):ErpSqlPool{
 validateErpPreviewConnectionString(config.connectionString,config.expectedHost,config.forbiddenHost);
 return new Pool({connectionString:config.connectionString,max:1,
  connectionTimeoutMillis:5000,idleTimeoutMillis:1000,
  ssl:{rejectUnauthorized:true}}) as unknown as ErpSqlPool;
}
