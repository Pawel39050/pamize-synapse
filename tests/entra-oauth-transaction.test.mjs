import test from "node:test";import assert from "node:assert/strict";import {randomBytes} from "node:crypto";
import {newOAuthTransaction} from "../src/lib/compliance/entra-oauth-flow.ts";
import {sealOAuthTransaction,openOAuthTransaction} from "../src/lib/compliance/entra-oauth-transaction.ts";
const secret=randomBytes(32).toString("base64url");
test("encrypted OAuth transaction round-trips",()=>{const t=newOAuthTransaction(1000);assert.deepEqual(openOAuthTransaction(sealOAuthTransaction(t,secret),secret,2000),t)});
test("tampering or incorrect key is rejected",()=>{const t=newOAuthTransaction(1000);const v=sealOAuthTransaction(t,secret);assert.throws(()=>openOAuthTransaction(v,randomBytes(32).toString("base64url"),2000));const a=v.split(".");a[1]=(a[1][0]==="A"?"B":"A")+a[1].slice(1);assert.throws(()=>openOAuthTransaction(a.join("."),secret,2000))});
test("reused stale or future OAuth transaction is rejected",()=>{const v=sealOAuthTransaction(newOAuthTransaction(1000),secret);assert.throws(()=>openOAuthTransaction(v,secret,302000));assert.throws(()=>openOAuthTransaction(v,secret,999))});
test("insecure encryption keys rejected",()=>{assert.throws(()=>sealOAuthTransaction(newOAuthTransaction(),"abc"))});
