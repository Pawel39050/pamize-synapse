import test from "node:test";import assert from "node:assert/strict";import {randomBytes} from "node:crypto";
import {sealComplianceSession,openComplianceSession} from "../src/lib/compliance/entra-session.ts";
const key=randomBytes(32).toString("base64url");
const data={subject:"person-1",tenantId:"tenant-1",roles:["author"],issuedAt:1000,expiresAt:5000};
test("session preserves authenticated roles and expires",()=>{let v=sealComplianceSession(data,key);assert.deepEqual(openComplianceSession(v,key,2000),data);assert.throws(()=>openComplianceSession(v,key,5000));});
test("session integrity and key separation",()=>{let v=sealComplianceSession(data,key);assert.throws(()=>openComplianceSession(v,randomBytes(32).toString("base64url"),2000));assert.throws(()=>openComplianceSession(v.slice(0,-2)+"xx",key,2000));});
test("invalid roles and long sessions are rejected",()=>{assert.throws(()=>sealComplianceSession({...data,roles:["admin"]},key));assert.throws(()=>sealComplianceSession({...data,expiresAt:1000+9*3600*1000},key));});

test("session rejects expired and future issued cookies",()=>{
 const v=sealComplianceSession(data,key);
 assert.throws(()=>openComplianceSession(v,key,5001),/Expired/);
 assert.throws(()=>openComplianceSession(v,key,999),/Expired/);
});
test("session rejects malformed cookie envelopes",()=>{
 for(const value of ["","invalid","a.b","a.b.c.d","a".repeat(4097)]){
  assert.throws(()=>openComplianceSession(value,key,2000));
 }
});
test("session refuses incorrect encryption keys and missing role claims",()=>{
 assert.throws(()=>sealComplianceSession({...data,roles:["administrator"]},key));
 assert.throws(()=>sealComplianceSession({...data,subject:""},key));
 assert.throws(()=>sealComplianceSession({...data,tenantId:""},key));
});
test("session cannot be replayed across separate keys",()=>{
 const otherKey=randomBytes(32).toString("base64url");
 const v=sealComplianceSession(data,key);
 assert.throws(()=>openComplianceSession(v,otherKey,2000));
});
