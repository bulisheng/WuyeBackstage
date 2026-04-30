const ROLE_ACCESS_PRESETS = {
	super_admin: {
		menus: ['dashboard', 'owners', 'announcements', 'communities', 'permissions', 'repairs', 'fees', 'complaints', 'notices'],
		actions: ['*'],
		note: '超级管理员拥有全部菜单和全部动作'
	},
	admin: {
		menus: ['dashboard', 'owners', 'announcements', 'communities', 'permissions', 'repairs', 'fees', 'complaints', 'notices'],
		actions: ['community:view', 'community:edit', 'community:delete', 'announcement:view', 'announcement:publish', 'announcement:delete', 'owner:view', 'owner:audit', 'repair:view', 'repair:assign', 'repair:update', 'repair:close', 'fee:view', 'fee:collect', 'fee:remind', 'fee:export', 'complaint:view', 'complaint:handle', 'notice:view', 'notice:publish', 'admin:role:view', 'admin:user:view', 'admin:user:manage', 'admin:permission:view', 'admin:permission:manage'],
		note: '管理员默认可见全部业务菜单'
	},
	finance: {
		menus: ['dashboard', 'fees', 'notices'],
		actions: ['fee:view', 'fee:collect', 'fee:remind', 'fee:export', 'notice:view', 'notice:publish'],
		note: '财务默认只看缴费和通知'
	},
	customer_service: {
		menus: ['dashboard', 'owners', 'announcements', 'repairs', 'complaints', 'notices'],
		actions: ['owner:view', 'owner:audit', 'announcement:view', 'announcement:publish', 'repair:view', 'repair:assign', 'repair:update', 'complaint:view', 'complaint:handle', 'notice:view', 'notice:publish'],
		note: '客服默认只看住户、公告、报修、投诉、通知'
	},
	repairman: {
		menus: ['dashboard', 'repairs', 'notices'],
		actions: ['repair:view', 'repair:assign', 'repair:update', 'repair:close', 'notice:view'],
		note: '维修默认只看工单和通知'
	}
};

const ROUTE_RULES = {
	'admin/dashboard': { module: 'dashboard', action: 'dashboard:view' },
	'admin/owner/list': { module: 'owners', action: 'owner:view' },
	'admin/owner/audit': { module: 'owners', action: 'owner:audit' },
	'admin/community/list': { module: 'communities', action: 'community:view' },
	'admin/community/save': { module: 'communities', action: 'community:edit' },
	'admin/community/delete': { module: 'communities', action: 'community:delete' },
	'admin/role/list': { module: 'permissions', action: 'admin:role:view' },
	'admin/user/list': { module: 'permissions', action: 'admin:user:view' },
	'admin/user/save': { module: 'permissions', action: 'admin:user:manage' },
	'admin/user/delete': { module: 'permissions', action: 'admin:user:manage' },
	'admin/permission/list': { module: 'permissions', action: 'admin:permission:view' },
	'admin/permission/save': { module: 'permissions', action: 'admin:permission:manage' },
	'admin/permission/delete': { module: 'permissions', action: 'admin:permission:manage' },
	'admin/repair/list': { module: 'repairs', action: 'repair:view' },
	'admin/fee/list': { module: 'fees', action: 'fee:view' },
	'admin/complaint/list': { module: 'complaints', action: 'complaint:view' },
	'admin/notice_config/list': { module: 'notices', action: 'notice:view' },
	'admin/announcement/list': { module: 'announcements', action: 'announcement:view' },
	'admin/announcement/save': { module: 'announcements', action: 'announcement:publish' },
	'admin/announcement/delete': { module: 'announcements', action: 'announcement:delete' }
};

const LEGACY_PERMISSION_ALIASES = {
	repair: ['repair:view', 'repair:assign', 'repair:update', 'repair:close'],
	fee: ['fee:view', 'fee:collect', 'fee:remind', 'fee:export'],
	notice: ['notice:view', 'notice:publish'],
	announcement: ['announcement:view', 'announcement:publish', 'announcement:delete'],
	owner: ['owner:view', 'owner:audit'],
	community: ['community:view', 'community:edit', 'community:delete'],
	user: ['admin:user:view', 'admin:user:manage'],
	permission: ['admin:permission:view', 'admin:permission:manage'],
	admin: ['admin:role:view', 'admin:user:view', 'admin:user:manage', 'admin:permission:view', 'admin:permission:manage']
};

function normalizeText(value) {
	return String(value == null ? '' : value).trim();
}

function unique(values = []) {
	return [...new Set(values.filter(Boolean))];
}

function parsePermissionTokens(value) {
	if (Array.isArray(value)) {
		return value.map((item) => normalizeText(item)).filter(Boolean);
	}
	return normalizeText(value)
		.split(/[\s,，]+/)
		.map((item) => normalizeText(item))
		.filter(Boolean);
}

function expandPermissionTokens(tokens = []) {
	const menus = [];
	const actions = [];
	for (const token of parsePermissionTokens(tokens)) {
		if (!token) continue;
		if (token === '*') {
			actions.push('*');
			continue;
		}
		if (token.startsWith('menu:')) {
			menus.push(token.slice(5));
			continue;
		}
		if (token.startsWith('action:')) {
			actions.push(token.slice(7));
			continue;
		}
		if (LEGACY_PERMISSION_ALIASES[token]) {
			actions.push(...LEGACY_PERMISSION_ALIASES[token]);
			continue;
		}
		actions.push(token);
	}
	return {
		menus: unique(menus),
		actions: unique(actions)
	};
}

function buildRoleAccessProfile(role) {
	const key = normalizeText(role) || 'admin';
	const preset = ROLE_ACCESS_PRESETS[key] || ROLE_ACCESS_PRESETS.admin;
	return {
		role: key,
		roleLabel: key,
		menus: unique(preset.menus),
		actions: unique(preset.actions),
		note: preset.note
	};
}

function buildEffectiveAccess(role, permissions = []) {
	const base = buildRoleAccessProfile(role);
	const overrides = expandPermissionTokens(permissions);
	if (base.actions.includes('*')) {
		return {
			...base,
			menus: unique(base.menus.concat(overrides.menus)),
			actions: ['*'],
			overrideMenus: overrides.menus,
			overrideActions: overrides.actions
		};
	}
	return {
		...base,
		menus: unique(base.menus.concat(overrides.menus)),
		actions: unique(base.actions.concat(overrides.actions)),
		overrideMenus: overrides.menus.filter((item) => !base.menus.includes(item)),
		overrideActions: overrides.actions.filter((item) => !base.actions.includes(item))
	};
}

function buildAccessibleCommunityIds(admin = {}, permissionRecords = [], communities = []) {
	const adminRole = normalizeText(admin.role) || 'admin';
	if (adminRole === 'super_admin') {
		return unique((Array.isArray(communities) ? communities : []).map((item) => String(item.id)));
	}
	const ids = [];
	const adminCommunityId = Number(admin.community_id || admin.communityId || 0);
	if (adminCommunityId > 0) ids.push(String(adminCommunityId));
	for (const item of Array.isArray(permissionRecords) ? permissionRecords : []) {
		const communityId = Number(item && item.community_id != null ? item.community_id : item.communityId);
		if (communityId > 0) ids.push(String(communityId));
	}
	return unique(ids);
}

function hasModuleAccess(access = {}, moduleKey) {
	const key = normalizeText(moduleKey);
	if (!key) return true;
	if (Array.isArray(access.menus) && access.menus.includes(key)) return true;
	if (Array.isArray(access.actions) && access.actions.includes('*')) return true;
	return false;
}

function hasActionAccess(access = {}, actionKey) {
	const key = normalizeText(actionKey);
	if (!key) return true;
	if (Array.isArray(access.actions) && access.actions.includes('*')) return true;
	if (Array.isArray(access.actions) && access.actions.includes(key)) return true;
	return false;
}

function hasCommunityAccess(access = {}, communityId) {
	const key = String(communityId == null ? '' : communityId).trim();
	if (!key) return true;
	if (Array.isArray(access.communityIds) && access.communityIds.includes(key)) return true;
	if (access.role === 'super_admin') return true;
	return false;
}

function getRouteRule(route) {
	return ROUTE_RULES[normalizeText(route)] || null;
}

module.exports = {
	ROLE_ACCESS_PRESETS,
	ROUTE_RULES,
	LEGACY_PERMISSION_ALIASES,
	parsePermissionTokens,
	expandPermissionTokens,
	buildRoleAccessProfile,
	buildEffectiveAccess,
	buildAccessibleCommunityIds,
	hasModuleAccess,
	hasActionAccess,
	hasCommunityAccess,
	getRouteRule
};
