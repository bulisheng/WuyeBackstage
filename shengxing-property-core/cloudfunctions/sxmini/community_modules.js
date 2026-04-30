const MODULE_CATALOG = [
	{ key: 'dashboard', name: '工作台', sort: 1, entryType: 'dashboard', group: 'primary', authRequired: false },
	{ key: 'owners', name: '业主认证', sort: 2, entryType: 'owner', group: 'primary', authRequired: false },
	{ key: 'communities', name: '小区信息', sort: 3, entryType: 'community', group: 'primary', authRequired: false },
	{ key: 'permissions', name: '权限管理', sort: 4, entryType: 'permission', group: 'settings', authRequired: true },
	{ key: 'repairs', name: '报修', sort: 5, entryType: 'repair', group: 'primary', authRequired: true },
	{ key: 'fees', name: '缴费', sort: 6, entryType: 'fee', group: 'primary', authRequired: true },
	{ key: 'complaints', name: '投诉建议', sort: 7, entryType: 'complaint', group: 'primary', authRequired: true },
	{ key: 'notices', name: '通知配置', sort: 8, entryType: 'notice', group: 'secondary', authRequired: false },
	{ key: 'announcements', name: '公告', sort: 9, entryType: 'announcement', group: 'secondary', authRequired: false },
	{ key: 'audit', name: '审计', sort: 10, entryType: 'audit', group: 'settings', authRequired: true }
];

function normalizeText(value) {
	return String(value == null ? '' : value).trim();
}

function cloneModuleCatalog() {
	return MODULE_CATALOG.map((item) => Object.assign({}, item));
}

function buildDefaultCommunityModules(communityId) {
	const communityKey = Number(communityId);
	return MODULE_CATALOG.map((item) => ({
		communityId: communityKey,
		moduleKey: item.key,
		moduleName: item.name,
		enabled: 1,
		sort: item.sort
	}));
}

function buildCommunityModuleMap(records = []) {
	return (Array.isArray(records) ? records : []).reduce((acc, item) => {
		const key = normalizeText(item && (item.moduleKey || item.module_key));
		if (!key) return acc;
		acc[key] = Object.assign({}, item, {
			moduleKey: key,
			moduleName: normalizeText(item.moduleName || item.module_name || ''),
			enabled: item.enabled === true || item.enabled === 1 || item.enabled === '1'
		});
		return acc;
	}, {});
}

function buildCommunityModuleList(records = []) {
	const map = buildCommunityModuleMap(records);
	return cloneModuleCatalog().map((item) => {
		const record = map[item.key] || null;
		return Object.assign({}, item, {
			communityId: record ? Number(record.communityId || record.community_id || 0) : 0,
			moduleKey: item.key,
			moduleName: item.name,
			enabled: record ? Boolean(record.enabled) : true,
			record
		});
	});
}

function buildEnabledModuleKeys(records = []) {
	return buildCommunityModuleList(records)
		.filter((item) => item.enabled)
		.map((item) => item.key);
}

module.exports = {
	MODULE_CATALOG,
	cloneModuleCatalog,
	buildDefaultCommunityModules,
	buildCommunityModuleMap,
	buildCommunityModuleList,
	buildEnabledModuleKeys
};
