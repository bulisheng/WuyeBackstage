const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../permission_engine.js');

test('role presets decide default menus', () => {
	const finance = engine.buildRoleAccessProfile('finance');
	assert.deepEqual(finance.menus, ['dashboard', 'fees', 'notices']);
	assert.ok(finance.actions.includes('fee:view'));
});

test('admin preset keeps permission management read actions', () => {
	const admin = engine.buildRoleAccessProfile('admin');
	assert.ok(admin.actions.includes('admin:role:view'));
	assert.ok(admin.actions.includes('admin:user:view'));
	assert.ok(admin.actions.includes('admin:permission:view'));
	assert.ok(admin.actions.includes('community:module:view'));
	assert.ok(admin.actions.includes('community:module:manage'));
});

test('community overrides extend action permissions', () => {
	const merged = engine.buildEffectiveAccess('repairman', ['repair:close', 'repair:escalate']);
	assert.ok(merged.menus.includes('repairs'));
	assert.ok(merged.actions.includes('repair:close'));
	assert.ok(merged.actions.includes('repair:escalate'));
	assert.ok(merged.overrideActions.includes('repair:escalate'));
});

test('accessible communities are derived from admin and permission records', () => {
	const ids = engine.buildAccessibleCommunityIds(
		{ role: 'admin', community_id: 3 },
		[{ communityId: 8 }, { community_id: 9 }],
		[{ id: 1 }, { id: 2 }]
	);
	assert.deepEqual(ids, ['3', '8', '9']);
	assert.equal(engine.hasCommunityAccess({ communityIds: ids }, 8), true);
	assert.equal(engine.hasCommunityAccess({ communityIds: ids }, 2), false);
});

test('route rules map admin endpoints to module and action keys', () => {
	assert.deepEqual(engine.getRouteRule('admin/community/save'), { module: 'communities', action: 'community:edit' });
	assert.deepEqual(engine.getRouteRule('admin/announcement/delete'), { module: 'announcements', action: 'announcement:delete' });
	assert.deepEqual(engine.getRouteRule('admin/audit/list'), { module: 'permissions', action: 'admin:audit:view' });
	assert.deepEqual(engine.getRouteRule('admin/community/module/save'), { module: 'permissions', action: 'community:module:manage' });
});

test('module enablement only passes when current community module is enabled', () => {
	assert.equal(engine.hasModuleEnabled({ enabledModules: ['dashboard', 'repairs'] }, 'dashboard'), true);
	assert.equal(engine.hasModuleEnabled({ enabledModules: ['dashboard', 'repairs'] }, 'fees'), false);
});

console.log('permission engine assertions passed');
