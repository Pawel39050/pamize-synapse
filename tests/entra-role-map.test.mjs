import test from "node:test";import assert from "node:assert/strict";
import {resolveEntraComplianceRoles} from "../src/lib/compliance/entra-role-map.ts";
test("Microsoft Entra role values map exactly to internal permissions",()=>{
 assert.deepEqual(resolveEntraComplianceRoles(["Compliance.Author","Compliance.Reviewer","Compliance.Viewer"]),["author","reviewer","viewer"]);
});
test("untrusted aliases and malformed roles cannot elevate permissions",()=>{
 assert.deepEqual(resolveEntraComplianceRoles(["author","admin","Compliance.Admin",null,7,{}]),[]);
});
test("duplicate role claims are deduplicated",()=>{
 assert.deepEqual(resolveEntraComplianceRoles(["Compliance.Author","Compliance.Author"]),["author"]);
});
