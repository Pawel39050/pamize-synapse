import test from "node:test";import assert from "node:assert/strict";
import {checkEntraSetupReadiness} from "../src/lib/compliance/entra-setup-readiness.ts";
const k=Buffer.alloc(32,7).toString("base64url"),k2=Buffer.alloc(32,8).toString("base64url");
const good={VERCEL_ENV:"preview",VERCEL_GIT_COMMIT_REF:"feature/compliance-guardian",ENTRA_TENANT_ID:"9ecd1821-b171-47c2-89e9-1c1a78c2a8e6",ENTRA_API_CLIENT_ID:"d6e46e06-8e1c-4a69-aea1-d1c3b1ff0276",ENTRA_REDIRECT_URI:"https://pamize-synapse-git-feature-comp-7ded4c-radekdomagalski1978-9203.vercel.app/api/compliance/auth/callback",ENTRA_CLIENT_SECRET:"secret",ENTRA_OAUTH_COOKIE_KEY:k,ENTRA_SESSION_KEY:k2};
test("all valid preview setup names pass",()=>assert.equal(checkEntraSetupReadiness(good).ready,true));
test("missing client secret blocks login readiness",()=>assert.ok(checkEntraSetupReadiness({...good,ENTRA_CLIENT_SECRET:undefined}).missing.includes("ENTRA_CLIENT_SECRET")));
test("wrong branch blocks login readiness",()=>assert.ok(checkEntraSetupReadiness({...good,VERCEL_GIT_COMMIT_REF:"main"}).missing.includes("ISOLATED_PREVIEW_BRANCH")));
test("same encryption key is prohibited",()=>assert.ok(checkEntraSetupReadiness({...good,ENTRA_SESSION_KEY:k}).missing.includes("SEPARATE_ENCRYPTION_KEYS")));
test("noncanonical base64url and pasted API-like secrets fail",()=>{
 assert.ok(checkEntraSetupReadiness({...good,ENTRA_OAUTH_COOKIE_KEY:"sk_live_not_an_encryption_key"}).missing.includes("ENTRA_OAUTH_COOKIE_KEY:invalid-key"));
 assert.ok(checkEntraSetupReadiness({...good,ENTRA_SESSION_KEY:k+"="}).missing.includes("ENTRA_SESSION_KEY:invalid-key"));
});
test("invalid redirect URL or app identifiers block authentication",()=>{
 assert.ok(checkEntraSetupReadiness({...good,ENTRA_REDIRECT_URI:"https://attacker.example/callback"}).missing.includes("APPROVED_PREVIEW_REDIRECT_URI"));
 assert.ok(checkEntraSetupReadiness({...good,ENTRA_TENANT_ID:"bad"}).missing.includes("VALID_ENTRA_APP_IDENTIFIERS"));
});
