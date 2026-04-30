import assert from 'node:assert/strict';
import { buildPermissionMatrix, buildPermissionRecord, listRoleOptions } from '../src/utils/permissions.js';

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

const matrix = buildPermissionMatrix(
	[
		{ id: 1, name: '荣尊堡', schemaName: 'rzb' },
		{ id: 2, name: '欧陆经典', schemaName: 'oljd' }
	],
	[
		{ communityId: 1, role: 'finance', permissions: ['fee', 'notice'], active: 1 },
		{ communityId: 1, role: 'finance', permissions: ['fee'], active: 0 },
		{ communityId: 2, role: 'repairman', permissions: ['repair'], active: 1 }
	]
);

assert.equal(matrix.roleColumns.length, 5);
assert.equal(matrix.communityRows.length, 2);
assert.equal(matrix.communityRows[0].cells[2].summary.includes('财务'), true);
assert.equal(matrix.communityRows[0].cells[2].count, 2);
assert.equal(matrix.communityRows[1].cells[4].count, 1);

console.log('permission utils assertions passed');
