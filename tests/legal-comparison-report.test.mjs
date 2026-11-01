import test from "node:test";
import assert from "node:assert/strict";
import {makeLegalComparisonReport} from "../src/lib/compliance/legal-comparison-report.ts";
const base={sourceId:"eu-gdpr",celex:"32016R0679",oldVersionId:"2016-05-04",newVersionId:"2026-11-01",officialSourceUrl:"https://eur-lex.europa.eu/eli/reg/2016/679/oj",generatedAt:"2026-11-01T20:00:00Z",oldArticles:[{identifier:"Art. 1",heading:null,text:"Old wording"}],newArticles:[{identifier:"Art. 1",heading:null,text:"New wording"}]};
test("report preserves provenance and requires legal review",()=>{
 const result=makeLegalComparisonReport(base);
 assert.equal(result.status,"requires-legal-review");
 assert.equal(result.counts.modified,1);
 assert.equal(result.changes[0].identifier,"Art. 1");
});
test("report rejects same version and nonofficial domain",()=>{
 assert.throws(()=>makeLegalComparisonReport({...base,newVersionId:base.oldVersionId}),/distinct/);
 assert.throws(()=>makeLegalComparisonReport({...base,officialSourceUrl:"https://example.org/doc"}),/Official/);
});
