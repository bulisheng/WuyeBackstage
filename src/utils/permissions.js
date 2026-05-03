const ROLE_OPTIONS = [
	{ value: 'super_admin', label: '超级管理员', scope: '全部小区、全部模块、全部权限' },
	{ value: 'admin', label: '管理员', scope: '按分配小区管理业务' },
	{ value: 'finance', label: '财务', scope: '缴费、账单、催缴情境' },
	{ value: 'customer_service', label: '客服', scope: '报修、投诉、通知' },
	{ value: 'repairman', label: '维修', scope: '工单处理' }
];

const ROLE_ACCESS_PRESETS = {
	super_admin: {
		menus: ['dashboard', 'owners', 'announcements', 'activities', 'surveys', 'faq', 'communities', 'permissions', 'staff', 'repairs', 'fees', 'complaints', 'property_service', 'customer_service', 'mall', 'notices'],
		actions: ['*'],
		note: '超管拥有全量菜单和动作权限'
	},
	admin: {
		menus: ['dashboard', 'owners', 'announcements', 'activities', 'surveys', 'faq', 'communities', 'permissions', 'staff', 'repairs', 'fees', 'complaints', 'property_service', 'customer_service', 'mall', 'notices'],
		actions: ['dashboard:view', 'community:view', 'community:edit', 'community:delete', 'community:module:view', 'community:module:manage', 'announcement:view', 'announcement:publish', 'announcement:delete', 'activity:view', 'activity:manage', 'activity:checkin', 'survey:view', 'survey:manage', 'faq:view', 'faq:manage', 'staff:view', 'staff:manage', 'owner:view', 'owner:manage', 'owner:audit', 'tenant:view', 'tenant:manage', 'resident:import', 'resident:change_log:view', 'repair:view', 'repair:assign', 'repair:update', 'repair:close', 'fee:view', 'fee:manage', 'fee:collect', 'fee:remind', 'fee:export', 'complaint:view', 'complaint:handle', 'service:view', 'service:handle', 'customer:view', 'customer:handle', 'mall:view', 'mall:product', 'mall:order', 'mall:after_sale', 'mall:dashboard', 'notice:view', 'notice:publish', 'admin:role:view', 'admin:user:view', 'admin:user:manage', 'admin:permission:view', 'admin:permission:manage', 'admin:audit:view'],
		note: '管理员默认看到全部业务菜单'
	},
	finance: {
		menus: ['dashboard', 'fees', 'mall', 'notices'],
		actions: ['fee:view', 'fee:collect', 'fee:remind', 'fee:export', 'mall:view', 'mall:order', 'mall:dashboard'],
		note: '财务只显示缴费相关菜单'
	},
	customer_service: {
		menus: ['dashboard', 'owners', 'announcements', 'activities', 'surveys', 'faq', 'staff', 'repairs', 'complaints', 'property_service', 'customer_service', 'notices'],
		actions: ['dashboard:view', 'owner:view', 'owner:manage', 'owner:audit', 'tenant:view', 'tenant:manage', 'resident:import', 'resident:change_log:view', 'staff:view', 'staff:manage', 'announcement:view', 'announcement:publish', 'activity:view', 'activity:manage', 'activity:checkin', 'survey:view', 'survey:manage', 'faq:view', 'faq:manage', 'repair:view', 'repair:assign', 'repair:update', 'complaint:view', 'complaint:handle', 'service:view', 'service:handle', 'customer:view', 'customer:handle', 'notice:view', 'notice:publish'],
		note: '客服默认显示与住户和工单相关的菜单'
	},
	repairman: {
		menus: ['dashboard', 'staff', 'repairs', 'notices'],
		actions: ['dashboard:view', 'staff:view', 'repair:view', 'repair:assign', 'repair:update', 'repair:close', 'notice:view'],
		note: '维修默认显示工单入口'
	}
};

const MENU_LABELS = {
	dashboard: '数据看板',
	owners: '住户管理',
	announcements: '公告管理',
	activities: '社区活动',
	surveys: '社区调研',
	faq: '常见问题',
	communities: '小区配置',
	permissions: '权限管理',
	staff: '物业人员',
	repairs: '报修管理',
	fees: '缴费管理',
	complaints: '投诉建议',
	property_service: '物业服务',
	customer_service: '在线客服',
	mall: '盛兴严选',
	notices: '通知配置'
};

const ACTION_LABELS = {
	'*': '全部动作',
	'dashboard:view': '查看工作台',
	'community:view': '查看小区',
	'community:edit': '小区编辑',
	'community:delete': '删除小区',
	'community:module:view': '模块查看',
	'community:module:manage': '模块管理',
	'announcement:view': '查看公告',
	'announcement:publish': '公告发布',
	'announcement:delete': '删除公告',
	'activity:view': '查看活动',
	'activity:manage': '活动管理',
	'activity:checkin': '活动签到',
	'survey:view': '查看调研',
	'survey:manage': '调研管理',
	'faq:view': '查看常见问题',
	'faq:manage': '常见问题管理',
	'staff:view': '查看物业人员',
	'staff:manage': '物业人员管理',
	'owner:view': '查看业主',
	'owner:manage': '业主管理',
	'owner:audit': '业主审核',
	'tenant:view': '查看租户',
	'tenant:manage': '租户管理',
	'resident:import': '住户导入',
	'resident:change_log:view': '变更记录',
	'repair:view': '查看报修',
	'repair:assign': '派单报修',
	'repair:update': '更新工单',
	'repair:close': '关闭工单',
	'fee:view': '查看缴费',
	'fee:collect': '收款登记',
	'fee:remind': '催缴提醒',
	'fee:export': '导出账单',
	'fee:manage': '缴费管理',
	'complaint:view': '查看投诉',
	'complaint:handle': '处理投诉',
	'service:view': '查看服务',
	'service:handle': '处理服务',
	'customer:view': '查看客服',
	'customer:handle': '处理客服',
	'mall:view': '查看商城',
	'mall:product': '商品管理',
	'mall:order': '订单处理',
	'mall:after_sale': '售后处理',
	'mall:dashboard': '商城看板',
	'notice:view': '查看通知',
	'notice:publish': '发布通知',
	'admin:role:view': '查看角色',
	'admin:user:view': '查看管理员',
	'admin:user:manage': '管理管理员',
	'admin:permission:view': '查看权限',
	'admin:permission:manage': '管理权限',
	'admin:audit:view': '查看审计'
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
	const deniedMenus = [];
	const deniedActions = [];
	tokens.forEach((token) => {
		if (token.startsWith('!menu:')) {
			deniedMenus.push(token.slice(6));
			return;
		}
		if (token.startsWith('!action:')) {
			deniedActions.push(token.slice(8));
			return;
		}
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
	return { menuTokens, actionTokens, deniedMenus, deniedActions };
}

function buildEffectiveAccess(role, permissions = []) {
	const profile = buildRoleAccessProfile(role);
	const { menuTokens, actionTokens, deniedMenus, deniedActions } = splitPermissionTokens(permissions);
	const deniedMenuSet = new Set(deniedMenus);
	const deniedActionSet = new Set(deniedActions);
	const menus = [...new Set([...profile.menus, ...menuTokens])].filter((item) => !deniedMenuSet.has(item));
	const actions = profile.actions.includes('*') && deniedActionSet.has('*')
		? [...new Set(actionTokens)].filter((item) => !deniedActionSet.has(item))
		: [...new Set([...profile.actions, ...actionTokens])].filter((item) => !deniedActionSet.has(item));
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
		extraActionLabels: extraActions.map((item) => buildActionLabel(item)),
		deniedMenus,
		deniedMenuLabels: deniedMenus.map((item) => buildMenuLabel(item)),
		deniedActions,
		deniedActionLabels: deniedActions.map((item) => buildActionLabel(item))
	};
}

function buildPermissionTokensFromSelections(role, selectedMenus = [], selectedActions = []) {
	const profile = buildRoleAccessProfile(role);
	const selectedMenuSet = new Set(parsePermissions(selectedMenus));
	const selectedActionSet = new Set(parsePermissions(selectedActions));
	const tokens = [];
	selectedMenuSet.forEach((item) => {
		if (!profile.menus.includes(item)) tokens.push(`menu:${item}`);
	});
	profile.menus.forEach((item) => {
		if (!selectedMenuSet.has(item)) tokens.push(`!menu:${item}`);
	});
	selectedActionSet.forEach((item) => {
		if (!profile.actions.includes(item)) tokens.push(`action:${item}`);
	});
	profile.actions.forEach((item) => {
		if (!selectedActionSet.has(item)) tokens.push(`!action:${item}`);
	});
	return tokens;
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
	buildPermissionTokensFromSelections,
	parsePermissions,
	buildPermissionMatrix,
	summarizePermissions
};
