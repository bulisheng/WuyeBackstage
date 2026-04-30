const ROLE_OPTIONS = [
	{ value: 'super_admin', label: '超级管理员', scope: '全部小区、全部模块、全部权限' },
	{ value: 'admin', label: '管理员', scope: '按分配小区管理业务' },
	{ value: 'finance', label: '财务', scope: '缴费、账单、催缴情境' },
	{ value: 'customer_service', label: '客服', scope: '报修、投诉、通知' },
	{ value: 'repairman', label: '维修', scope: '工单处理' }
];

const ROLE_ACCESS_PRESETS = {
	super_admin: {
		menus: ['dashboard', 'owners', 'announcements', 'communities', 'permissions', 'repairs', 'fees', 'complaints', 'notices'],
		actions: ['*'],
		note: '超管拥有全量菜单和动作权限'
	},
	admin: {
		menus: ['dashboard', 'owners', 'announcements', 'communities', 'permissions', 'repairs', 'fees', 'complaints', 'notices'],
		actions: ['community:edit', 'community:module:view', 'community:module:manage', 'announcement:publish', 'owner:audit', 'repair:assign', 'fee:manage', 'complaint:handle', 'notice:publish'],
		note: '管理员默认看到全部业务菜单'
	},
	finance: {
		menus: ['dashboard', 'fees', 'notices'],
		actions: ['fee:view', 'fee:collect', 'fee:remind', 'fee:export'],
		note: '财务只显示缴费相关菜单'
	},
	customer_service: {
		menus: ['dashboard', 'owners', 'announcements', 'repairs', 'complaints', 'notices'],
		actions: ['owner:audit', 'announcement:publish', 'repair:view', 'repair:assign', 'complaint:handle', 'notice:publish'],
		note: '客服默认显示与住户和工单相关的菜单'
	},
	repairman: {
		menus: ['dashboard', 'repairs', 'notices'],
		actions: ['repair:view', 'repair:assign', 'repair:update', 'repair:close'],
		note: '维修默认显示工单入口'
	}
};

const MENU_LABELS = {
	dashboard: '数据看板',
	owners: '业主认证',
	announcements: '公告管理',
	communities: '小区配置',
	permissions: '权限管理',
	repairs: '报修管理',
	fees: '缴费管理',
	complaints: '投诉建议',
	notices: '通知配置'
};

const ACTION_LABELS = {
	'*': '全部动作',
	'community:edit': '小区编辑',
	'community:module:view': '模块查看',
	'community:module:manage': '模块管理',
	'announcement:publish': '公告发布',
	'owner:audit': '业主审核',
	'repair:view': '查看报修',
	'repair:assign': '派单报修',
	'repair:update': '更新工单',
	'repair:close': '关闭工单',
	'fee:view': '查看缴费',
	'fee:collect': '收款登记',
	'fee:remind': '催缴提醒',
	'fee:export': '导出账单',
	'fee:manage': '缴费管理',
	'complaint:handle': '处理投诉',
	'notice:publish': '发布通知'
};

function normalizeText(value) {
	return String(value == null ? '' : value).trim();
}

function listRoleOptions() {
	return ROLE_OPTIONS.map((item) => Object.assign({}, item));
}

function parsePermissions(value) {
	if (Array.isArray(value)) {
		return value.map((item) => normalizeText(item)).filter(Boolean);
	}
	return normalizeText(value)
		.split(/[\s,，]+/)
		.map((item) => normalizeText(item))
		.filter(Boolean);
}

function buildPermissionRecord(form = {}) {
	const adminId = Number(form.adminId);
	const communityId = Number(form.communityId);
	const role = normalizeText(form.role) || 'admin';
	return {
		adminId: Number.isFinite(adminId) && adminId > 0 ? adminId : 0,
		communityId: Number.isFinite(communityId) && communityId > 0 ? communityId : 0,
		role,
		permissions: parsePermissions(form.permissions),
		active: form.active === false || form.active === 0 || form.active === '0' ? 0 : 1
	};
}

function buildRoleLabel(role) {
	const found = ROLE_OPTIONS.find((item) => item.value === normalizeText(role));
	return found ? found.label : normalizeText(role);
}

function buildMenuLabel(menu) {
	return MENU_LABELS[normalizeText(menu)] || normalizeText(menu);
}

function buildActionLabel(action) {
	return ACTION_LABELS[normalizeText(action)] || normalizeText(action);
}

function buildRoleAccessProfile(role) {
	const key = normalizeText(role) || 'admin';
	const preset = ROLE_ACCESS_PRESETS[key] || ROLE_ACCESS_PRESETS.admin;
	const menus = [...new Set(preset.menus)];
	const actions = [...new Set(preset.actions)];
	return {
		role: key,
		roleLabel: buildRoleLabel(key),
		menus,
		menuLabels: menus.map((item) => buildMenuLabel(item)),
		actions,
		actionLabels: actions.map((item) => buildActionLabel(item)),
		note: preset.note
	};
}

function splitPermissionTokens(value) {
	const tokens = parsePermissions(value);
	const menuTokens = [];
	const actionTokens = [];
	tokens.forEach((token) => {
		if (token.startsWith('menu:')) {
			menuTokens.push(token.slice(5));
			return;
		}
		if (token.startsWith('action:')) {
			actionTokens.push(token.slice(7));
			return;
		}
		actionTokens.push(token);
	});
	return { menuTokens, actionTokens };
}

function buildEffectiveAccess(role, permissions = []) {
	const profile = buildRoleAccessProfile(role);
	const { menuTokens, actionTokens } = splitPermissionTokens(permissions);
	const menus = [...new Set([...profile.menus, ...menuTokens])];
	const actions = [...new Set([...profile.actions, ...actionTokens])];
	const extraMenus = menuTokens.filter((item) => !profile.menus.includes(item));
	const extraActions = actionTokens.filter((item) => !profile.actions.includes(item));
	return {
		role: profile.role,
		roleLabel: profile.roleLabel,
		menus,
		menuLabels: menus.map((item) => buildMenuLabel(item)),
		actions,
		actionLabels: actions.map((item) => buildActionLabel(item)),
		extraMenus,
		extraMenuLabels: extraMenus.map((item) => buildMenuLabel(item)),
		extraActions,
		extraActionLabels: extraActions.map((item) => buildActionLabel(item))
	};
}

function summarizePermissions(records = []) {
	if (!Array.isArray(records) || !records.length) return '无';
	const activeRecords = records.filter((item) => item && item.active !== false && item.active !== 0 && item.active !== '0');
	const first = records[0] || {};
	const permissions = activeRecords.flatMap((item) => parsePermissions(item.permissions));
	const access = buildEffectiveAccess(first.role, permissions);
	const menuText = access.menuLabels.slice(0, 2).join('、');
	const actionText = access.extraActionLabels.slice(0, 3).join('、') || access.actionLabels.slice(0, 3).join('、');
	return `${access.roleLabel}${activeRecords.length}/${records.length}${menuText ? ` · 菜单: ${menuText}` : ''}${actionText ? ` · 动作: ${actionText}` : ''}`;
}

function buildPermissionMatrix(communities = [], permissions = [], roles = ROLE_OPTIONS) {
	const roleColumns = (Array.isArray(roles) ? roles : ROLE_OPTIONS).map((item) => ({
		value: item.value,
		label: item.label
	}));
	const communityRows = (Array.isArray(communities) ? communities : []).map((community) => {
		const cells = roleColumns.map((role) => {
			const records = (Array.isArray(permissions) ? permissions : []).filter((item) =>
				Number(item.communityId) === Number(community.id) && String(item.role || '').trim() === role.value
			);
			return {
				role: role.value,
				label: role.label,
				count: records.length,
				summary: summarizePermissions(records),
				records
			};
		});
		return {
			communityId: Number(community.id),
			communityName: normalizeText(community.name),
			schemaName: normalizeText(community.schemaName),
			cells
		};
	});
	return { roleColumns, communityRows };
}

export {
	ROLE_OPTIONS,
	ROLE_ACCESS_PRESETS,
	listRoleOptions,
	buildPermissionRecord,
	buildRoleLabel,
	buildMenuLabel,
	buildActionLabel,
	buildRoleAccessProfile,
	buildEffectiveAccess,
	parsePermissions,
	buildPermissionMatrix,
	summarizePermissions
};
