import test from 'node:test';
import assert from 'node:assert/strict';
import {canAccessRemediation,verifyRemediationLedger} from '../src/lib/compliance/remediation-audit-ledger.ts';
test('missing verified identity denies access',()=>{assert.equal(canAccessRemediation(null,'tenant-a','org-a','read'),false);});
test('empty audit ledger is valid',()=>{assert.equal(verifyRemediationLedger({tenantId:'tenant-a',organizationId:'org-a',actions:[],events:[]}),true);});

const principal={issuer:'entra-id-verified',subject:'owner-a',tenantId:'tenant-a',roles:['author'],organizationIds:['org-a']};
const reviewer={...principal,subject:'reviewer-b',roles:['reviewer']};
const original={id:'task-a',obligationId:'gdpr-art-32',description:'Collect evidence',priority:'high',state:'proposed',ownerId:null,dueDate:null,reviewerId:null,approvedAt:null,sourceUrl:'https://eur-lex.europa.eu/'};
const base=()=>({tenantId:'tenant-a',organizationId:'org-a',actions:[original],events:[]});
test('assignment and independent review produce verifiable audit chain',async()=>{
 const {appendRemediationEvent}=await import('../src/lib/compliance/remediation-audit-ledger.ts');
 let ledger=appendRemediationEvent({ledger:base(),action:{...original,state:'assigned',ownerId:'owner-a',dueDate:'2026-12-01'},principal,operation:'assign',previousState:'proposed',at:'2026-11-02T10:00:00Z'});
 ledger=appendRemediationEvent({ledger,action:{...ledger.actions[0],state:'in-progress'},principal,operation:'progress',previousState:'assigned',at:'2026-11-02T10:05:00Z'});
 ledger=appendRemediationEvent({ledger,action:{...ledger.actions[0],state:'awaiting-review'},principal,operation:'progress',previousState:'in-progress',at:'2026-11-02T10:10:00Z'});
 assert.throws(()=>appendRemediationEvent({ledger,action:{...ledger.actions[0],state:'approved'},principal,operation:'review',previousState:'awaiting-review',at:'2026-11-02T10:15:00Z'}));
 ledger=appendRemediationEvent({ledger,action:{...ledger.actions[0],state:'approved'},principal:reviewer,operation:'review',previousState:'awaiting-review',at:'2026-11-02T10:20:00Z'});
 assert.equal(verifyRemediationLedger(ledger),true);
 assert.equal(ledger.events.length,4);
 assert.equal(verifyRemediationLedger({...ledger,events:[{...ledger.events[0],actorId:'other'},...ledger.events.slice(1)]}),false);
});
test('cross-organization action rejected',async()=>{
 const {appendRemediationEvent}=await import('../src/lib/compliance/remediation-audit-ledger.ts');
 assert.throws(()=>appendRemediationEvent({ledger:base(),action:{...original,state:'assigned',ownerId:'owner-a',dueDate:'2026-12-01'},principal:{...principal,organizationIds:['org-b']},operation:'assign',previousState:'proposed',at:'2026-11-02T10:00:00Z'}));
});
