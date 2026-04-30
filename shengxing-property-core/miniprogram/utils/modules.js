const HOME_ENTRY_CATALOG = [
	{ moduleKey: 'owners', title: '业主认证', desc: '查看认证状态与完善资料', type: 'owner', mark: '证', theme: 'green', group: 'primary', authRequired: false },
	{ moduleKey: 'fees', title: '生活缴费', desc: '账单、支付、记录', type: 'life', mark: '缴', theme: 'blue', group: 'primary', authRequired: true },
	{ moduleKey: 'repairs', title: '报事报修', desc: '提交、处理、回访', type: 'repair', mark: '修', theme: 'green', group: 'primary', authRequired: true },
	{ moduleKey: 'complaints', title: '投诉建议', desc: '反馈、跟进、归档', type: 'complaint', mark: '诉', theme: 'orange', group: 'primary', authRequired: true },
	{ moduleKey: 'announcements', title: '社区公告', desc: '查看最新公告', type: 'announcement', mark: '告', theme: 'pink', group: 'secondary', authRequired: false },
	{ moduleKey: 'notices', title: '通知提醒', desc: '接收重要通知', type: 'notice', mark: '知', theme: 'teal', group: 'secondary', authRequired: false },
	{ moduleKey: 'communities', title: '小区资料', desc: '查看小区信息', type: 'community', mark: '区', theme: 'gray', group: 'secondary', authRequired: false }
];

function buildModuleMap(records = []) {
	return (Array.isArray(records) ? records : []).reduce((acc, item) => {
		const key = String(item && (item.moduleKey || item.module_key) || '').trim();
		if (!key) return acc;
		acc[key] = item;
		return acc;
	}, {});
}

function buildHomeEntryGroups(records = [], state = {}) {
	const moduleMap = buildModuleMap(records);
	const isOwnerAuthed = Boolean(state && state.isOwnerAuthed);
	const groups = {
		primaryServices: [],
		convenienceServices: []
	};
	for (const item of HOME_ENTRY_CATALOG) {
		const moduleRecord = moduleMap[item.moduleKey];
		const enabled = moduleRecord ? moduleRecord.enabled !== false && moduleRecord.enabled !== 0 && moduleRecord.enabled !== '0' : true;
		if (!enabled) continue;
		const disabled = Boolean(item.authRequired && !isOwnerAuthed);
		const entry = {
			moduleKey: item.moduleKey,
			title: item.title,
			desc: disabled ? `${item.desc} · 认证后可用` : item.desc,
			type: item.type,
			mark: item.mark,
			theme: item.theme,
			group: item.group,
			disabled
		};
		if (item.group === 'primary') {
			groups.primaryServices.push(entry);
		} else {
			groups.convenienceServices.push(entry);
		}
	}
	return groups;
}

module.exports = {
	HOME_ENTRY_CATALOG,
	buildModuleMap,
	buildHomeEntryGroups
};
