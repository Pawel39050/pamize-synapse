import test from "node:test";
import assert from "node:assert/strict";
import { compareLegalProvisions } from "../src/lib/compliance/legal-provision-diff.ts";

const article=(identifier,text,heading=null)=>({identifier,text,heading});
test("identical text and whitespace-only differences are ignored",()=>{
  assert.deepEqual(compareLegalProvisions([article("Art. 1","A  B")],[article("Art. 1","A B")]),[]);
});
test("reports modification, addition and removal with article references",()=>{
  const diff=compareLegalProvisions(
    [article("Art. 1","old"),article("Art. 2","removed")],
    [article("Art. 1","new"),article("Art. 3","added")]
  );
  assert.deepEqual(diff.map(x=>[x.identifier,x.kind]),[
    ["Art. 1","modified"],["Art. 2","removed"],["Art. 3","added"]
  ]);
});
test("rejects duplicate article identifiers",()=>{
  assert.throws(()=>compareLegalProvisions([article("Art. 1","a"),article("Art. 1","b")],[]),/Duplicate/);
});
test("rejects unstructured or empty legal provisions",()=>{
  assert.throws(()=>compareLegalProvisions([article("<script>","bad")],[]),/Invalid/);
  assert.throws(()=>compareLegalProvisions([article("Art. 1"," ")],[]),/Invalid/);
});
