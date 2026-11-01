import test from "node:test";
import assert from "node:assert/strict";
import {createLegalActVersion,verifyLegalActVersion,requireDistinctVerifiedVersions} from "../src/lib/compliance/legal-act-version.ts";
const article=[{identifier:"Art. 1",heading:null,text:"Test"}];
const make=(label,raw)=>createLegalActVersion({sourceId:"eu-gdpr",celex:"32016R0679",officialUrl:"https://publications.europa.eu/resource/celex/32016R0679",manifestationId:label,retrievedAt:"2026-11-01T00:00:00Z",officialVersionLabel:label,rawDocument:Buffer.from(raw),articles:article});
test("captured text starts unverified with a reproducible hash",()=>{
 const a=make("label-a","document-a");
 assert.equal(a.authenticity,"pending-official-verification");
 assert.match(a.documentSha256,/^[a-f0-9]{64}$/);
});
test("identical documents cannot be treated as different legal versions",()=>{
 const a=verifyLegalActVersion(make("a","same"),"a"),b=verifyLegalActVersion(make("b","same"),"b");
 assert.throws(()=>requireDistinctVerifiedVersions(a,b),/distinct/);
});
test("two different verified versions are accepted for text comparison",()=>{
 const a=verifyLegalActVersion(make("a","old"),"a"),b=verifyLegalActVersion(make("b","new"),"b");
 assert.doesNotThrow(()=>requireDistinctVerifiedVersions(a,b));
});
test("unverified evidence is rejected",()=>{
 assert.throws(()=>requireDistinctVerifiedVersions(make("a","old"),make("b","new")),/verified/);
});
