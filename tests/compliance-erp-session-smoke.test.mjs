import test from 'node:test';
import assert from 'node:assert/strict';
import {assertDedicatedErpReadOnlySession} from '../src/lib/compliance/erp-session-identity-check.ts';
test('missing facts fail closed',()=>assert.throws(()=>assertDedicatedErpReadOnlySession(null,'erp_reader')));

const base={currentUser:'erp_reader',sessionUser:'erp_reader',sessionCanLogin:true,sessionBypassRls:false,sessionSuperuser:false,sessionCreateRole:false,sessionCreateDb:false,activeBypassRls:false,rlsEnabled:true,rlsForced:true,canRead:true,canInsert:false,canUpdate:false,canDelete:false};
test('restricted login accepted',()=>assert.doesNotThrow(()=>assertDedicatedErpReadOnlySession(base,'erp_reader')));
test('different session principal denied',()=>assert.throws(()=>assertDedicatedErpReadOnlySession({...base,sessionUser:'other_login'},'erp_reader')));
test('bypassing RLS denied',()=>assert.throws(()=>assertDedicatedErpReadOnlySession({...base,sessionBypassRls:true},'erp_reader')));
test('write permission denied',()=>assert.throws(()=>assertDedicatedErpReadOnlySession({...base,canUpdate:true},'erp_reader')));
