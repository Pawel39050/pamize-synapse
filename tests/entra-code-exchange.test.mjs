import test from "node:test";import assert from "node:assert/strict";
import {newOAuthTransaction} from "../src/lib/compliance/entra-oauth-flow.ts";
import {exchangeEntraAuthorizationCode} from "../src/lib/compliance/entra-code-exchange.ts";
const transaction=newOAuthTransaction(1000);
const base={tenantId:"9ecd1821-b171-47c2-89e9-1c1a78c2a8e6",clientId:"d6e46e06-8e1c-4a69-aea1-d1c3b1ff0276",
 clientSecret:"test_secret_never_real",redirectUri:"https://pamize-synapse-git-feature-comp-7ded4c-radekdomagalski1978-9203.vercel.app/api/compliance/auth/callback",
 code:"test_code",returnedState:transaction.state,transaction};
test("incorrect state is rejected before any network use",async()=>{
 await assert.rejects(exchangeEntraAuthorizationCode({...base,returnedState:"mismatch"}),/state/);
});
test("missing client secret cannot exchange an OAuth code",async()=>{
 const current=newOAuthTransaction();
 await assert.rejects(exchangeEntraAuthorizationCode({...base,clientSecret:"",returnedState:current.state,transaction:current}),/configuration/);
});
test("unapproved callback URL is rejected",async()=>{
 const current=newOAuthTransaction();
 await assert.rejects(exchangeEntraAuthorizationCode({...base,redirectUri:"https://wrong.example/api/compliance/auth/callback",returnedState:current.state,transaction:current}),/Callback/);
});
