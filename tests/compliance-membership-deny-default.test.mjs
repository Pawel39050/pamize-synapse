import test from 'node:test';
import assert from 'node:assert/strict';
import {denyAllMembershipDirectory} from '../src/lib/compliance/organization-membership.ts';
test('unprovisioned directory returns no memberships', async () => {
 const records = await denyAllMembershipDirectory.findForSubject({tenantId:'test',subject:'test-user'});
 assert.deepEqual(records, []);
});
