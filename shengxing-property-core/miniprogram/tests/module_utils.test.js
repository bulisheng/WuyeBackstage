const test = require('node:test');
const assert = require('node:assert/strict');
const modules = require('../utils/modules.js');

test('home entries are grouped by module and respect auth state', () => {
	const groups = modules.buildHomeEntryGroups([
		{ moduleKey: 'fees', enabled: 1 },
		{ moduleKey: 'repairs', enabled: 0 },
		{ moduleKey: 'announcements', enabled: 1 }
	], { isOwnerAuthed: false });

	assert.equal(groups.primaryServices.some((item) => item.moduleKey === 'fees'), true);
	assert.equal(groups.primaryServices.some((item) => item.moduleKey === 'repairs'), false);
	assert.equal(groups.primaryServices.find((item) => item.moduleKey === 'fees').disabled, true);
	assert.equal(groups.convenienceServices.some((item) => item.moduleKey === 'announcements'), true);
});

console.log('module utils assertions passed');
