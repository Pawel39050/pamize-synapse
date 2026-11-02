import test from "node:test";import assert from "node:assert/strict";import {randomBytes} from "node:crypto";
import {sealComplianceSession,openComplianceSession} from "../src/lib/compliance/entra-session.ts";
const key=randomBytes(32).toString("base64url");
const data={subject:"person-1",tenantId:"tenant-1",roles:["author"],issuedAt:1000,expiresAt:5000};
test("session preserves authenticated roles and expires",()=>{let v=sealComplianceSession(data,key);assert.deepEqual(openComplianceSession(v,key,2000),data);assert.throws(()=>openComplianceSession(v,key,5000));});
test("session integrity and key separation",()=>{let v=sealComplianceSession(data,key);assert.throws(()=>openComplianceSession(v,randomBytes(32).toString("base64url"),2000));assert.throws(()=>openComplianceSession(v.slice(0,-2)+"xx",key,2000));});
test("invalid roles and long sessions are rejected",()=>{assert.throws(()=>sealComplianceSession({...data,roles:["admin"]},key));assert.throws(()=>sealComplianceSession({...data,expiresAt:1000+9*3600*1000},key));});
