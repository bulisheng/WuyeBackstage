const test = require('node:test');
const assert = require('node:assert/strict');
const modules = require('../community_modules.js');

test('module catalog includes the expected core modules', () => {
	assert.ok(Array.isArray(modules.MODULE_CATALOG));
	assert.ok(modules.MODULE_CATALOG.length >= 10);
	assert.equal(modules.MODULE_CATALOG[0].key, 'dashboard');
	assert.equal(modules.MODULE_CATALOG.some((item) => item.key === 'permissions'), true);
	assert.equal(modules.MODULE_CATALOG.some((item) => item.key === 'audit'), true);
});

test('community module list defaults missing records to enabled', () => {
	const list = modules.buildCommunityModuleList([
		{ moduleKey: 'dashboard', enabled: 0, moduleName: '工作台' }
	]);
	const dashboard = list.find((item) => item.key === 'dashboard');
	const fees = list.find((item) => item.key === 'fees');
	assert.equal(dashboard.enabled, false);
	assert.equal(fees.enabled, true);
});

test('default community modules seed all catalog entries', () => {
	const defaults = modules.buildDefaultCommunityModules(7);
	assert.equal(defaults.length, modules.MODULE_CATALOG.length);
	assert.ok(defaults.every((item) => item.communityId === 7 && item.enabled === 1));
});

console.log('community modules assertions passed');
