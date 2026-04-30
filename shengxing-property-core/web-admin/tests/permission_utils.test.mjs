import assert from 'node:assert/strict';
import { buildPermissionRecord, listRoleOptions } from '../src/utils/permissions.js';

const options = listRoleOptions();
assert.ok(options.length >= 5);
assert.equal(options[0].value, 'super_admin');

const record = buildPermissionRecord({
	adminId: ' 12 ',
	communityId: ' 8 ',
	role: ' finance ',
	permissions: ' repair , fee , notice '
});

assert.deepEqual(record, {
	adminId: 12,
	communityId: 8,
	role: 'finance',
	permissions: ['repair', 'fee', 'notice'],
	active: 1
});

console.log('permission utils assertions passed');
