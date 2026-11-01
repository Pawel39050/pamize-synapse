import test from "node:test";
import assert from "node:assert/strict";
import {GDPR_OFFICIAL_REFERENCES,assessStoredGdprVersionIdentity} from "../src/lib/compliance/gdpr-official-references.ts";
test("GDPR reference distinguishes original OJ from informational consolidation",()=>{
 assert.equal(GDPR_OFFICIAL_REFERENCES.celex,"32016R0679");
 assert.equal(GDPR_OFFICIAL_REFERENCES.consolidatedHasLegalForce,false);
 assert.equal(GDPR_OFFICIAL_REFERENCES.knownCorrigenda.length,2);
});
test("stored record cannot be called legally verified by its CELEX and hash alone",()=>{
 const result=assessStoredGdprVersionIdentity({celex:"32016R0679",documentSha256:"a".repeat(64),manifestationId:"unknown",officialVersionLabel:null});
 assert.equal(result.status,"requires-manifestation-verification");
});
test("wrong CELEX rejected",()=>{
 assert.throws(()=>assessStoredGdprVersionIdentity({celex:"32024R1689",documentSha256:"a".repeat(64),manifestationId:"x",officialVersionLabel:null}));
});
