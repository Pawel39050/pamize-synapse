import test from 'node:test';
import assert from 'node:assert/strict';
import {assertDedicatedErpReadOnlySession} from '../src/lib/compliance/erp-session-identity-check.ts';
test('missing facts fail closed',()=>assert.throws(()=>assertDedicatedErpReadOnlySession(null,'erp_reader')));
