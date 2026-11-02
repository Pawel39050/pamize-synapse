import test from 'node:test';
import assert from 'node:assert/strict';
import {canAccessRemediation,verifyRemediationLedger} from '../src/lib/compliance/remediation-audit-ledger.ts';
test('missing verified identity denies access',()=>{assert.equal(canAccessRemediation(null,'tenant-a','org-a','read'),false);});
test('empty audit ledger is valid',()=>{assert.equal(verifyRemediationLedger({tenantId:'tenant-a',organizationId:'org-a',actions:[],events:[]}),true);});
