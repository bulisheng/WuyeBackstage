import assert from 'node:assert/strict';
import { buildModuleMatrix, MODULE_CATALOG, buildModuleToggleSummary } from '../src/utils/modules.js';

const matrix = buildModuleMatrix(
	[{ id: 1, name: '荣尊堡', schemaName: 'rzb' }],
	MODULE_CATALOG,
	[{ communityId: 1, moduleKey: 'fees', enabled: 0 }]
);

assert.equal(matrix.moduleColumns.length, MODULE_CATALOG.length);
assert.equal(matrix.rows[0].modules.find((item) => item.key === 'fees').enabled, false);
assert.equal(matrix.rows[0].modules.find((item) => item.key === 'repairs').enabled, true);
assert.equal(buildModuleToggleSummary(matrix.rows[0].modules), `${MODULE_CATALOG.length - 1}/${MODULE_CATALOG.length}`);

console.log('module utils assertions passed');
