const MODULE_CATALOG = [
	{ key: 'dashboard', name: '工作台', sort: 1, group: 'primary', authRequired: false, description: '数据概览与快捷入口' },
	{ key: 'owners', name: '住户管理', sort: 2, group: 'primary', authRequired: false, description: '业主、租户与住户变更记录' },
	{ key: 'communities', name: '小区信息', sort: 3, group: 'primary', authRequired: false, description: '小区基础资料与配置' },
	{ key: 'permissions', name: '权限管理', sort: 4, group: 'settings', authRequired: true, description: '管理员、权限与模块配置' },
	{ key: 'repairs', name: '报修', sort: 5, group: 'primary', authRequired: true, description: '报修工单与处理' },
	{ key: 'fees', name: '缴费', sort: 6, group: 'primary', authRequired: true, description: '缴费账单与催缴' },
	{ key: 'complaints', name: '投诉建议', sort: 7, group: 'primary', authRequired: true, description: '投诉与建议处理' },
	{ key: 'notices', name: '通知配置', sort: 8, group: 'secondary', authRequired: false, description: '消息模板与通知通道' },
	{ key: 'announcements', name: '公告', sort: 9, group: 'secondary', authRequired: false, description: '公告发布与管理' },
	{ key: 'audit', name: '审计', sort: 10, group: 'settings', authRequired: true, description: '后台操作审计记录' }
];

function cloneModuleCatalog() {
	return MODULE_CATALOG.map((item) => Object.assign({}, item));
}

function buildModuleMatrix(communities = [], modules = MODULE_CATALOG, records = []) {
	const moduleColumns = (Array.isArray(modules) ? modules : MODULE_CATALOG).map((item) => Object.assign({}, item));
	const rows = (Array.isArray(communities) ? communities : []).map((community) => ({
		communityId: Number(community.id),
		communityName: String(community.name || ''),
		schemaName: String(community.schemaName || ''),
		modules: moduleColumns.map((module) => {
			const record = (Array.isArray(records) ? records : []).find((item) =>
				Number(item.communityId) === Number(community.id) && String(item.moduleKey || '') === module.key
			);
			return {
				key: module.key,
				name: module.name,
				description: module.description || '',
				sort: module.sort,
				group: module.group,
				authRequired: module.authRequired,
				enabled: record ? Boolean(record.enabled) : true,
				record
			};
		})
	}));
	return { moduleColumns, rows };
}

function buildModuleToggleSummary(records = []) {
	const enabled = (Array.isArray(records) ? records : []).filter((item) => item.enabled !== false && item.enabled !== 0 && item.enabled !== '0');
	return `${enabled.length}/${Array.isArray(records) ? records.length : 0}`;
}

export {
	MODULE_CATALOG,
	cloneModuleCatalog,
	buildModuleMatrix,
	buildModuleToggleSummary
};
